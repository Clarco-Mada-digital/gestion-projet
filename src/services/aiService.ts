import { AISettings, Project, Task, SubTask, AppState } from '../types';
import { loadDocumentation } from '../utils/documentationLoader';
import { getAppDataSummary, formatAppDataForAI } from './appDataService';

export interface GeneratedSubTask {
  title: string;
  description?: string;
  group?: string; // Groupe optionnel pour l'organisation
}

export type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export class AIService {
  private static documentationCache: string | null = null;

  /**
   * Génère une réponse d'assistant IA en fonction du message de l'utilisateur
   * @param message Message de l'utilisateur
   * @param history Historique des messages (optionnel)
   * @param aiSettings Configuration IA
   * @param project Projet en cours (optionnel)
   * @param task Tâche en cours (optionnel)
   * @param appState État de l'application (optionnel)
   * @returns Réponse générée par l'IA
   */

  /**
   * Tente d'extraire et de parser un JSON de manière robuste
   */
  private static tryExtractJson(content: string): any {
    if (!content) return null;

    // Nettoyage agressif des blocs de code markdown
    let cleaned = content.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();

    // Extraction du bloc JSON le plus large (entre { } ou [ ])
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!jsonMatch) return null;

    let jsonStr = jsonMatch[0].trim();

    try {
      // 1. Tentative de parse standard
      return JSON.parse(jsonStr);
    } catch (e) {
      try {
        // 2. Tentative de correction des erreurs communes (virgules traînantes, etc.)
        // Supprime les virgules avant une fermeture de crochet ou d'accolade
        const fixedJson = jsonStr
          .replace(/,\s*([\]\}])/g, '$1')
          // Tente de gérer les retours à la ligne non échappés dans les chaînes (cas rare mais arrive)
          .replace(/\n/g, '\\n')
          // Mais il faut pas échapper les \n qui font déjà partie d'un \n légitime
          .replace(/\\\\n/g, '\\n');

        return JSON.parse(fixedJson);
      } catch (e2) {
        console.warn('Échec définitif du parsing JSON IA:', e2);
        return null;
      }
    }
  }

  /**
   * Nettoie le contenu de la réponse IA en supprimant les blocs de réflexion (DeepSeek, etc.)
   */
  private static cleanContent(content: string): string {
    if (!content) return '';

    // 1. Suppression des balises de réflexion standard (DeepSeek, etc.)
    let cleaned = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

    // 2. Extraction du contenu entre nos balises de contrôle si présentes
    const finalMatch = cleaned.match(/\[FINAL_START\]([\s\S]*?)\[FINAL_END\]/i);
    if (finalMatch && finalMatch[1]) {
      cleaned = finalMatch[1];
    }

    // 3. Nettoyage agressif des préambules "Réflexion :", "Je vais...", etc.
    // Si on détecte un JSON on déplace le pointeur au début du JSON
    const firstBrace = cleaned.search(/[\{\[]/);
    if (firstBrace > 0) {
      // Mais seulement si ce n'est pas une balise [FINAL_START] qui a été trouvée
      const preText = cleaned.substring(0, firstBrace);
      if (!preText.includes('[FINAL')) {
        cleaned = cleaned.substring(firstBrace);
      }
    }

    // 4. Suppression des blocs de code Markdown
    cleaned = cleaned.replace(/```(?:json)?([\s\S]*?)```/gi, '$1');

    return cleaned.trim();
  }

  /**
   * Valide et remplace les modèles obsolètes par des alternatives fonctionnelles
   */
  private static sanitizeModel(provider: string, model: string | undefined | null): string {
    if (provider === 'openai') {
      return model || 'gpt-3.5-turbo';
    }

    if (provider === 'gemini') {
      return model || 'gemini-1.5-flash';
    }

    // Liste des modèles OpenRouter obsolètes ou problématiques
    const deprecatedModels = [
      'google/gemma-7b-it:free',
      'google/gemini-2.0-flash-exp:free',
      'google/gemma-2-9b-it:free',
      'openrouter/auto',
      ''
    ];

    if (!model || deprecatedModels.includes(model)) {
      // Modèle gratuit le plus stable et performant en 2026
      return 'meta-llama/llama-3.1-8b-instruct:free';
    }

    return model;
  }

  /**
   * Détermine la version de l'API Gemini à utiliser en fonction du modèle
   */
  private static getGeminiVersion(model: string): string {
    const modelLower = model.toLowerCase();
    // Les modèles de préversion, expérimentaux ou gemini-3.x (pour l'instant) nécessitent v1beta
    if (
      modelLower.includes('preview') || 
      modelLower.includes('exp') || 
      modelLower.includes('gemini-3') ||
      modelLower.includes('gemini-2') ||
      modelLower.includes('flash-8b') ||
      modelLower.includes('thought')
    ) {
      return 'v1beta';
    }
    return 'v1';
  }

  /**
   * Effectue un fetch avec un mécanisme de retry intelligent
   */
  private static async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<Response> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const response = await fetch(url, { ...options, signal });

        // Succès ou erreur non-rétentable
        if (response.ok) return response;

        // Erreurs rétentables (Rate limit 429 ou erreurs serveurs 5xx)
        if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          console.warn(`[IA Service] Erreur ${response.status}. Tentative ${attempt + 1}/${maxRetries} dans ${Math.round(delay)}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;

        // Ne pas retenter si c'est une annulation manuelle
        if (error instanceof Error && error.name === 'AbortError') throw error;

        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`[IA Service] Échec réseau (${error instanceof Error ? error.message : 'inconnu'}). Tentative ${attempt + 1}/${maxRetries} dans ${Math.round(delay)}ms...`);
        
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error(`Échec de la requête après ${maxRetries} tentatives`);
  }

  /**
   * Prépare le prompt système avec la documentation et le contexte utilisateur
   */
  private static async prepareSystemPrompt(appState?: AppState): Promise<string> {
    let documentation = '';
    try {
      // Utiliser un cache pour éviter de recharger la documentation à chaque message
      if (AIService.documentationCache) {
        documentation = AIService.documentationCache;
      } else {
        // Ajouter un timeout pour éviter de bloquer indéfiniment
        const controller = new AbortController();
        const docTimeout = setTimeout(() => controller.abort(), 5000); // 5 secondes pour charger la doc

        try {
          documentation = await loadDocumentation();
          AIService.documentationCache = documentation;
        } finally {
          clearTimeout(docTimeout);
        }
      }

      documentation = documentation
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[\#*_`~]+/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .substring(0, 3000);
    } catch (error) {
      console.error('Erreur lors du chargement de la documentation:', error);
    }

    let appDataInfo = '';
    if (appState) {
      try {
        const appData = getAppDataSummary(appState);
        appDataInfo = `\n\n## CONTEXTE UTILISATEUR ACTUEL\n${formatAppDataForAI(appData)}`;

        // Ajouter des précisions sur le projet sélectionné si disponible
        if (appState.selectedProject) {
          const project = appState.projects.find(p => p.id === appState.selectedProject);
          if (project) {
            appDataInfo += `\n\n### PROJET ACTUELLEMENT OUVERT\n- Nom : ${project.name}\n- Description : ${project.description || 'N/A'}\n- Tâches : ${project.tasks.length}\n- Statut : ${project.status}`;
          }
        }

        // Ajouter la vue actuelle pour aider à la navigation
        appDataInfo += `\n- Vue actuelle de l'utilisateur : ${appState.currentView}`;

      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    }

    return `Tu es "Nexus IA", l'assistant expert et guide personnel de l'application de Gestion de Projet.
Ton rôle est double :
1. **Guide de l'Application** : Aide l'utilisateur à naviguer. Explique où trouver les fonctionnalités.
   - Menu Sidebar : "Aujourd'hui" (Résumé), "Projets" (Liste complète), "Kanban" (Tableau visuel), "Calendrier", "Rapports" (Graphiques), "Paramètres".
   - Bouton "+" : Permet de créer une tâche ou un projet rapidement.
   - Paramètres d'IA : Pour changer de modèle ou de fournisseur (OpenAI/OpenRouter).
   - Collaboration : Explique comment partager un projet (bouton "Partager" sur la carte projet) ou inviter des membres.

3. **Analyste de Charge (Workload)** : Tu surveilles la santé de l'utilisateur. Si trop de tâches sont accumulées sur une courte période, préviens-le.
   - Si l'utilisateur a plus de 7h de travail estimé sur un jour, signale un risque de surmenage.
   - Aide à réorganiser le calendrier si des échéances sont impossibles à tenir.

4. **Expert en Estimation** : Basé sur l'historique des tâches complétées, aide à estimer le temps requis pour les nouvelles tâches.

## DOCUMENTATION DE RÉFÉRENCE
${documentation}

${appDataInfo}

## TES RÈGLES D'OR :
- **IDENTIFICATION DES BLOQUAGE** : Analyse toujours si un projet stagne (ex: aucune tâche terminée depuis 1 semaine) ou si des dépendances semblent manquer.
- **PRIORITÉS** : Si on te demande les priorités, regarde les dates d'échéances les plus proches et l'importance des projets.
- **TON** : Proactif, encourageant, mais lucide sur la charge de travail.
- **IMPORTANT** : NE PRODUIS JAMAIS DE RÉFLEXION INTERNE OU DE COMMENTAIRE SUR TON TRAVAIL.
- **STRUCTURE** : Ta réponse finale doit IMPÉRATIVEMENT être entourée des balises [FINAL_START] et [FINAL_END]. Tout ce qui est en dehors de ces balises sera ignoré.
  Exemple : [FINAL_START]Contenu utile ici...[FINAL_END]`;
  }

  /**
   * Génère une réponse d'assistant IA en fonction du message de l'utilisateur
   */
  static async generateAIResponse(
    message: string,
    history: { role: 'user' | 'assistant', content: string }[],
    aiSettings: AISettings,
    _project?: Project | null,
    _task?: Task | null,
    appState?: AppState
  ): Promise<{ content: string; error?: string }> {
    try {
      // Vérifier que les paramètres requis sont présents
      if (!aiSettings) {
        throw new Error('Paramètres IA non fournis');
      }

      const effectiveProvider = aiSettings.provider || 'openrouter';
      const apiKey = effectiveProvider === 'openai'
        ? aiSettings.openaiApiKey?.trim()
        : effectiveProvider === 'gemini'
          ? aiSettings.geminiApiKey?.trim()
          : aiSettings.openrouterApiKey?.trim();

      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      } else if (effectiveProvider === 'gemini' && !apiKey) {
        throw new Error('Clé API Gemini requise pour utiliser Google Gemini');
      }

      // Utiliser un modèle adapté
      const model = effectiveProvider === 'openai'
        ? (aiSettings.openaiModel || 'gpt-3.5-turbo')
        : effectiveProvider === 'gemini'
          ? (aiSettings.geminiModel || 'gemini-1.5-flash')
          : AIService.sanitizeModel(effectiveProvider, aiSettings.openrouterModel);

      let endpoint = '';
      if (effectiveProvider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
      } else if (effectiveProvider === 'gemini') {
        const version = AIService.getGeminiVersion(model);
        // Utiliser l'API native de Gemini pour plus de fiabilité
        endpoint = `https://generativelanguage.googleapis.com/${version}/${model.startsWith('models/') ? model : 'models/' + model}:generateContent?key=${apiKey}`;
      } else {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      }

      const systemPrompt = await this.prepareSystemPrompt(appState);

      // Préparer les messages avec l'historique et le nouveau message
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...history,
        { role: 'user', content: message }
      ];

      // Préparer les en-têtes
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Ajouter l'authentification uniquement si une clé est fournie
      if (apiKey) {
        if (effectiveProvider === 'gemini') {
          // Utiliser uniquement le paramètre ?key= dans l'URL pour éviter les problèmes CORS/preflight
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout après 30 secondes

      try {
        const body = effectiveProvider === 'gemini'
          ? JSON.stringify({
              contents: messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
              })),
              system_instruction: messages.find(m => m.role === 'system') ? {
                parts: [{ text: messages.find(m => m.role === 'system')?.content }]
              } : undefined,
              generationConfig: {
                temperature: aiSettings.temperature || 0.7,
                maxOutputTokens: aiSettings.maxTokens || 2500,
              }
            })
          : JSON.stringify({
              model,
              messages,
              temperature: 0.7,
              max_tokens: 2500,
            });

        const response = await AIService.fetchWithRetry(endpoint, {
          method: 'POST',
          headers,
          body
        }, 3, controller.signal);

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Erreur API:', errorData);
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Extraire le contenu selon le format
        let content = '';
        if (effectiveProvider === 'gemini') {
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          content = data.choices?.[0]?.message?.content || '';
        }

        // Nettoyer le contenu
        content = AIService.cleanContent(content);

        // Fallback reasoning pour OpenAI/OpenRouter uniquement
        if (!content && effectiveProvider !== 'gemini' && data.choices?.[0]?.message?.reasoning) {
          content = AIService.cleanContent(data.choices?.[0]?.message?.reasoning);
        }

        if (!content) {
          if (effectiveProvider === 'gemini' && data.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error('Le modèle Gemini a bloqué la réponse pour des raisons de sécurité.');
          }
          throw new Error('Réponse de l\'IA vide ou invalide');
        }

        return { content };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('La requête a pris trop de temps. Veuillez réessayer.');
          }
          throw error;
        }
        throw new Error('Une erreur inconnue est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse IA:', error);
      return {
        content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer plus tard.",
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }


  static async generateSubTasksWithAI(
    settings: AISettings,
    project: Project,
    task: Task,
    existingSubTasks: SubTask[] = []
  ): Promise<GeneratedSubTask[]> {
    try {
      const effectiveProvider = settings.provider || 'openrouter';
      const apiKey = effectiveProvider === 'openai'
        ? settings.openaiApiKey?.trim()
        : effectiveProvider === 'gemini'
          ? settings.geminiApiKey?.trim()
          : settings.openrouterApiKey?.trim();

      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      } else if (effectiveProvider === 'gemini' && !apiKey) {
        throw new Error('Clé API Gemini requise pour utiliser Google Gemini');
      }

      // Utiliser un modèle adapté
      const model = effectiveProvider === 'openai'
        ? (settings.openaiModel || 'gpt-3.5-turbo')
        : effectiveProvider === 'gemini'
          ? (settings.geminiModel || 'gemini-1.5-flash')
          : AIService.sanitizeModel(effectiveProvider, settings.openrouterModel);

      let endpoint = '';
      if (effectiveProvider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
      } else if (effectiveProvider === 'gemini') {
        const version = AIService.getGeminiVersion(model);
        endpoint = `https://generativelanguage.googleapis.com/${version}/${model.startsWith('models/') ? model : 'models/' + model}:generateContent?key=${apiKey}`;
      } else {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      }

      // Préparer le prompt concis
      const prompt = this.buildSubTaskPrompt(project, task, existingSubTasks);

      // Préparer les en-têtes
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(effectiveProvider === 'openrouter' && {
          'HTTP-Referer': window.location.href,
          'X-Title': 'Gestion de Projet App'
        })
      };

      // Ajouter l'authentification uniquement si une clé est fournie
      if (apiKey) {
        if (effectiveProvider === 'gemini') {
          // Utiliser uniquement le paramètre ?key= dans l'URL pour éviter les problèmes CORS/preflight
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const body = effectiveProvider === 'gemini' 
        ? JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `${prompt} (Génère uniquement 3-5 sous-tâches maximum, sois concis)` }]
            }],
            system_instruction: {
              parts: [{ text: 'Tu es un assistant concis qui aide à décomposer les tâches en sous-tâches. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ DANS LE BLOC [FINAL_START]...[FINAL_END], SANS AUCUNE RÉFLEXION.' }]
            },
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1000,
            }
          })
        : JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant concis qui aide à décomposer les tâches en sous-tâches. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ DANS LE BLOC [FINAL_START]...[FINAL_END], SANS AUCUNE RÉFLEXION.'
              },
              {
                role: 'user',
                content: `${prompt} (Génère uniquement 3-5 sous-tâches maximum, sois concis)`
              }
            ],
            temperature: 0.5,
            max_tokens: 1000,
          });

      const response = await AIService.fetchWithRetry(endpoint, {
        method: 'POST',
        headers,
        body
      }, 3);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = '';
      if (effectiveProvider === 'gemini') {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }

      content = AIService.cleanContent(content);

      if (!content && effectiveProvider !== 'gemini' && data.choices?.[0]?.message?.reasoning) {
        content = AIService.cleanContent(data.choices?.[0]?.message?.reasoning);
      }

      if (!content) {
        throw new Error('Réponse de l\'IA invalide - pas de contenu trouvé');
      }

      // Parser la réponse pour extraire les sous-tâches
      return this.parseSubTasksResponse(content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la génération des sous-tâches avec IA';
      console.error('Erreur lors de la génération des sous-tâches avec IA:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  private static buildSubTaskPrompt(project: Project, task: Task, existingSubTasks: SubTask[] = []): string {
    // Construire un prompt concis
    let prompt = `Projet: ${project.name}\n`;
    prompt += `Tâche: ${task.title}\n`;

    // Ajouter la description si elle existe
    if (task.description) {
      prompt += `Description: ${task.description.substring(0, 200)}${task.description.length > 200 ? '...' : ''}\n\n`;
    }

    // Lister les sous-tâches existantes avec leurs titres exacts pour éviter les doublons
    if (existingSubTasks.length > 0) {
      prompt += 'Sous-tâches existantes (NE PAS DUPLIQUER):\n';
      existingSubTasks.forEach((st, index) => {
        prompt += `${index + 1}. "${st.title}"${st.completed ? ' (terminée)' : ''}\n`;
      });
      prompt += '\n';
    }

    // Instructions améliorées : format strict pour éviter les erreurs de parsing
    prompt += `Génère 3-5 nouvelles sous-tâches pour cette tâche.\n`;
    prompt += `IMPORTANT:\n`;
    prompt += `- NE PAS générer de sous-tâches déjà existantes\n`;
    prompt += `- Sois extrêmement concis et actionnable\n`;
    prompt += `- RÉPONDS EXCLUSIVEMENT sous ce format JSON entre les balises [FINAL_START] et [FINAL_END] :\n`;
    prompt += `[FINAL_START]\n`;
    prompt += `[\n`;
    prompt += `  {"title": "Sous-tâche 1", "description": "Détails optionnels"},\n`;
    prompt += `  {"title": "Sous-tâche 2", "description": "Détails optionnels"}\n`;
    prompt += `]\n`;
    prompt += `[FINAL_END]\n`;

    return prompt;
  }

  private static parseSubTasksResponse(content: string): GeneratedSubTask[] {
    try {
      // 1. Essayer d'extraire le JSON de la réponse (Array ou Object avec 'tasks')
      const parsed = AIService.tryExtractJson(content);

      if (parsed) {
        // Cas A : C'est directement un tableau de tâches
        if (Array.isArray(parsed)) {
          // Vérifier s'il s'agit d'un tableau de groupes (format complexe)
          if (parsed.length > 0 && parsed[0].tasks) {
            const flattened: GeneratedSubTask[] = [];
            parsed.forEach((g: any) => {
              if (g.tasks && Array.isArray(g.tasks)) {
                g.tasks.forEach((t: any) => {
                  flattened.push({ title: t.title || t.name, description: t.description || '' });
                });
              }
            });
            return flattened;
          }

          return parsed.map(t => ({
            title: t.title || t.name || t,
            description: t.description || ''
          }));
        }

        // Cas B : C'est un objet (ex: { tasks: [...] } ou { group: "...", tasks: [...] })
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          return parsed.tasks.map((t: any) => ({
            title: t.title || t.name || 'Sous-tâche',
            description: t.description || ''
          }));
        }
      }

      // Si pas de JSON valide, essayer de parser manuellement
      const lines = content.split('\n').filter(line => line.trim() !== '');

      const subTasks: GeneratedSubTask[] = [];

      // Mots-clés indiquant une ligne de réflexion à ignorer
      const reasoningKeywords = [
        'premièrement', 'deuxièmement', 'ensuite', 'enfin', 'je vais',
        'regardons', 'l\'instruction', 'sujet', 'possibles', 'mais je dois',
        'groupes logiques', 'réflexion', 'analyse', 'voici', 'étape',
        'pour cette', 'je suggère', 'basé sur', 'pour décomposer'
      ];

      for (const line of lines) {
        const lowerLine = line.toLowerCase().trim();

        // Ignorer les lignes trop courtes ou qui semblent être de la réflexion
        if (lowerLine.length < 3 || reasoningKeywords.some(kw => lowerLine.startsWith(kw))) {
          continue;
        }

        const match = line.match(/^[\d\-\.\s*]*(.+?)(?:\.|:|$)/);
        if (match && match[1]) {
          const title = match[1].trim();
          // S'assurer que le titre est substantiel et ne ressemble pas à une phrase de transition
          if (title.length > 5 && !title.includes('je dois') && !title.includes('vais générer')) {
            subTasks.push({
              title: title,
              description: ''
            });
          }
        }
      }

      const result = subTasks.length > 0 ? subTasks : [{ title: 'Sous-tâche générée', description: '' }];
      return result;
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse des sous-tâches:', error);
      return [{ title: 'Sous-tâche générée', description: '' }];
    }
  }

  static async generateTask(
    settings: AISettings,
    project: Project,
    title: string,
    description: string
  ): Promise<{ title: string; description: string }> {
    try {
      const effectiveProvider = settings.provider || 'openrouter';
      const apiKey = effectiveProvider === 'openai'
        ? settings.openaiApiKey?.trim()
        : effectiveProvider === 'gemini'
          ? settings.geminiApiKey?.trim()
          : settings.openrouterApiKey?.trim();

      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      } else if (effectiveProvider === 'gemini' && !apiKey) {
        throw new Error('Clé API Gemini requise pour utiliser Google Gemini');
      }

      const model = effectiveProvider === 'openai'
        ? (settings.openaiModel || 'gpt-3.5-turbo')
        : effectiveProvider === 'gemini'
          ? (settings.geminiModel || 'gemini-1.5-flash')
          : AIService.sanitizeModel(effectiveProvider, settings.openrouterModel);

      let endpoint = '';
      if (effectiveProvider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
      } else if (effectiveProvider === 'gemini') {
        const version = AIService.getGeminiVersion(model);
        endpoint = `https://generativelanguage.googleapis.com/${version}/${model.startsWith('models/') ? model : 'models/' + model}:generateContent?key=${apiKey}`;
      } else {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      }

      // Construire le prompt pour générer une tâche
      const prompt = `Génère une tâche pour le projet "${project.name}". ` +
        (title ? `Titre suggéré: "${title}"` : '') +
        (description ? `\nDescription suggérée: "${description}"` : '') +
        '\n\nGénère un titre et une description détaillée pour cette tâche. ' +
        'Réponds au format JSON: { "title": "...", "description": "..." }';

      // Préparer les en-têtes
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(effectiveProvider === 'openrouter' && { 'HTTP-Referer': window.location.origin }),
      };

      // Ajouter l'authentification uniquement si une clé est fournie
      if (apiKey) {
        if (effectiveProvider === 'gemini') {
          // Utiliser uniquement le paramètre ?key= dans l'URL pour éviter les problèmes CORS/preflight
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const body = effectiveProvider === 'gemini'
        ? JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: prompt }]
            }],
            system_instruction: {
              parts: [{ text: 'Tu es un assistant qui aide à rédiger des titres et descriptions de tâches clairs et précis. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ DANS LE BLOC [FINAL_START]...[FINAL_END], SANS AUCUNE RÉFLEXION.' }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        : JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant qui aide à rédiger des titres et descriptions de tâches clairs et précis. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ DANS LE BLOC [FINAL_START]...[FINAL_END], SANS AUCUNE RÉFLEXION.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

      const response = await AIService.fetchWithRetry(endpoint, {
        method: 'POST',
        headers,
        body
      }, 3);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = '';
      if (effectiveProvider === 'gemini') {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }

      content = AIService.cleanContent(content);

      if (!content && effectiveProvider !== 'gemini' && data.choices?.[0]?.message?.reasoning) {
        content = AIService.cleanContent(data.choices?.[0]?.message?.reasoning);
      }

      if (!content) {
        throw new Error('Réponse de l\'IA invalide');
      }

      // Essayer d'extraire le JSON de la réponse
      const parsed = AIService.tryExtractJson(content);
      if (parsed) {
        return {
          title: parsed.title || title || 'Sans titre',
          description: parsed.description || content
        };
      }
      // Si on n'a pas pu extraire de JSON, on utilise le contenu brut
      return {
        title: title || 'Tâche générée',
        description: content
      };
    } catch (error) {
      console.error('Erreur lors de la génération de la tâche avec IA:', error);
      throw error;
    }
  }

  static async generateAiText(settings: AISettings, prompt: string, verbose: boolean = false): Promise<string> {
    try {
      const effectiveProvider = settings.provider || 'openrouter';
      const apiKey = effectiveProvider === 'openai'
        ? settings.openaiApiKey?.trim()
        : effectiveProvider === 'gemini'
          ? settings.geminiApiKey?.trim()
          : settings.openrouterApiKey?.trim();

      const model = effectiveProvider === 'openai'
        ? (settings.openaiModel || 'gpt-3.5-turbo')
        : effectiveProvider === 'gemini'
          ? (settings.geminiModel || 'gemini-1.5-flash')
          : AIService.sanitizeModel(effectiveProvider, settings.openrouterModel);

      let endpoint = '';
      if (effectiveProvider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
      } else if (effectiveProvider === 'gemini') {
        const version = AIService.getGeminiVersion(model);
        endpoint = `https://generativelanguage.googleapis.com/${version}/${model.startsWith('models/') ? model : 'models/' + model}:generateContent?key=${apiKey}`;
      } else {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      }

      // Préparer les en-têtes
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(effectiveProvider === 'openrouter' && {
          'HTTP-Referer': window.location.origin || 'http://localhost:3000',
          'X-Title': 'Gestion de Projet App'
        })
      };

      // Ajouter l'authentification si une clé est fournie
      if (apiKey) {
        if (effectiveProvider === 'gemini') {
          // Utiliser uniquement le paramètre ?key= dans l'URL pour éviter les problèmes CORS/preflight
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const body = effectiveProvider === 'gemini'
        ? JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `${prompt}${verbose ? ' (Sois très détaillé et complet)' : ' (Réponds de manière concise en moins de 300 mots)'}` }]
            }],
            system_instruction: {
              parts: [{ text: 'Tu es un assistant expert qui aide à générer des rapports professionnels. Ton ton est proactif, bienveillant et pédagogique. Tu expliques les concepts techniques pour qu\'un client non-expert puisse les comprendre facilement. RÉPONDS DIRECTEMENT ET UNIQUEMENT AVEC LE CONTENU DU RAPPORT DANS LE BLOC [FINAL_START]...[FINAL_END], SANS AUCUNE RÉFLEXION INTERNE OU COMMENTAIRE.' }]
            },
            generationConfig: {
              temperature: settings.temperature || 0.5,
              maxOutputTokens: verbose ? 2500 : (settings.maxTokens || 1000)
            }
          })
        : JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant expert qui aide à générer des rapports professionnels. Ton ton est proactif, bienveillant et pédagogique. Tu expliques les concepts techniques pour qu\'un client non-expert puisse les comprendre facilement. RÉPONDS DIRECTEMENT ET UNIQUEMENT AVEC LE CONTENU DU RAPPORT DANS LE BLOC [FINAL_START]...[FINAL_END], SANS AUCUNE RÉFLEXION INTERNE OU COMMENTAIRE.'
              },
              {
                role: 'user',
                content: `${prompt}${verbose ? ' (Sois très détaillé et complet)' : ' (Réponds de manière concise en moins de 300 mots)'}`
              }
            ],
            temperature: settings.temperature || 0.5,
            max_tokens: verbose ? 2500 : (settings.maxTokens || 1000),
          });

      const response = await AIService.fetchWithRetry(endpoint, {
        method: 'POST',
        headers,
        body
      }, 3);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = '';
      if (effectiveProvider === 'gemini') {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }
      
      content = AIService.cleanContent(content);

      if (!content && effectiveProvider !== 'gemini' && data.choices?.[0]?.message?.reasoning) {
        content = AIService.cleanContent(data.choices?.[0]?.message?.reasoning);
      }

      return content || 'Aucune réponse générée';

    } catch (error) {
      console.error('Erreur lors de la génération de texte avec IA:', error);
      // Renvoyer une réponse d'erreur plus conviviale
      if (error instanceof Error) {
        if (error.message.includes('402')) {
          throw new Error('Limite de crédits gratuits dépassée. Veuillez mettre à jour votre compte OpenRouter ou réessayer plus tard.');
        }
      }
      throw new Error('Erreur lors de la génération du rapport. Veuillez réessayer.');
    }
  }

  static async testConnection(settings: AISettings, message: string = 'Test de connexion'): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      // Utiliser OpenRouter par défaut si aucun fournisseur n'est spécifié
      const effectiveProvider = settings.provider || 'openrouter';
      const apiKey = effectiveProvider === 'openai'
        ? settings.openaiApiKey?.trim()
        : effectiveProvider === 'gemini'
          ? settings.geminiApiKey?.trim()
          : settings.openrouterApiKey?.trim();

      // Définir le modèle en fonction du fournisseur
      const model = effectiveProvider === 'openai'
        ? (settings.openaiModel || 'gpt-3.5-turbo')
        : effectiveProvider === 'gemini'
          ? (settings.geminiModel || 'gemini-1.5-flash')
          : AIService.sanitizeModel(effectiveProvider, settings.openrouterModel);

      let endpoint = '';
      if (effectiveProvider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
      } else if (effectiveProvider === 'gemini') {
        const version = AIService.getGeminiVersion(model);
        endpoint = `https://generativelanguage.googleapis.com/${version}/${model.startsWith('models/') ? model : 'models/' + model}:generateContent?key=${apiKey}`;
      } else {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      }

      // Préparer les en-têtes de base
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Configuration spécifique pour OpenRouter
      // Ajouter l'authentification si une clé est fournie
      if (apiKey) {
        if (effectiveProvider === 'gemini') {
          // Utiliser uniquement le paramètre ?key= dans l'URL pour éviter les problèmes CORS/preflight
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      // Ces en-têtes sont requis par OpenRouter
      if (effectiveProvider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin || 'http://localhost:3000';
        headers['X-Title'] = 'Gestion de Projet App';
      }

      const body = effectiveProvider === 'gemini'
        ? JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        : JSON.stringify({
            model: model,
            messages: [{ role: 'user' as const, content: message }],
            max_tokens: 5,
          });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `Erreur HTTP: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      
      // Valider la structure de réponse Gemini
      if (effectiveProvider === 'gemini' && !result.candidates?.[0]?.content) {
        throw new Error('Structure de réponse Gemini invalide');
      }

      return {
        success: true,
        message: `Connexion réussie avec ${effectiveProvider === 'openai' ? 'OpenAI' : effectiveProvider === 'gemini' ? 'Gemini' : 'OpenRouter'}`,
        data: result
      };
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);

      let errorMessage = 'Erreur inconnue';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      return {
        success: false,
        message: `Échec de la connexion: ${errorMessage}`,
        data: error
      };
    }
  }

  static async generateTasks(
    settings: AISettings,
    project: { name: string; description?: string; tasks?: any[] }
  ): Promise<any[]> {
    try {
      const effectiveProvider = settings.provider || 'openrouter';
      const apiKey = effectiveProvider === 'openai'
        ? settings.openaiApiKey?.trim()
        : effectiveProvider === 'gemini'
          ? settings.geminiApiKey?.trim()
          : settings.openrouterApiKey?.trim();

      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      }

      const model = effectiveProvider === 'openai'
        ? (settings.openaiModel || 'gpt-3.5-turbo')
        : effectiveProvider === 'gemini'
          ? (settings.geminiModel || 'gemini-1.5-flash')
          : AIService.sanitizeModel(effectiveProvider, settings.openrouterModel);

      let endpoint = '';
      if (effectiveProvider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
      } else if (effectiveProvider === 'gemini') {
        const version = AIService.getGeminiVersion(model);
        endpoint = `https://generativelanguage.googleapis.com/${version}/${model.startsWith('models/') ? model : 'models/' + model}:generateContent?key=${apiKey}`;
      } else {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      }

      // Préparer le prompt
      let prompt = `Génère 3 à 5 tâches pertinentes pour le projet "${project.name}".`;
      if (project.description) {
        prompt += `\nDescription du projet : ${project.description}`;
      }

      if (project.tasks && project.tasks.length > 0) {
        prompt += `\nTâches déjà existantes :\n${project.tasks.slice(0, 5).map((t: any, i: number) => `${i + 1}. ${t.title}`).join('\n')}`;
      }

      prompt += '\n\nGénère les tâches au format JSON array. Retourne uniquement le JSON, pas de texte supplémentaire.';

      // Préparer les en-têtes
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(effectiveProvider === 'openrouter' && { 'HTTP-Referer': window.location.origin }),
      };

      // Ajouter l'authentification uniquement si une clé est fournie
      if (apiKey) {
        if (effectiveProvider === 'gemini') {
          // Utiliser uniquement le paramètre ?key= dans l'URL pour éviter les problèmes CORS/preflight
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const body = effectiveProvider === 'gemini'
        ? JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: prompt }]
            }],
            system_instruction: {
              parts: [{ text: 'Tu es un assistant expert en gestion de projet qui génère des tâches pertinentes et structurées au format JSON. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ, SANS AUCUNE RÉFLEXION OU TEXTE AVANT/APRÈS.' }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        : JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant expert en gestion de projet qui génère des tâches pertinentes et structurées au format JSON. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ, SANS AUCUNE RÉFLEXION OU TEXTE AVANT/APRÈS.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = '';
      if (effectiveProvider === 'gemini') {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }
      
      content = AIService.cleanContent(content);

      // Essayer d'extraire le JSON
      const tasks = AIService.tryExtractJson(content);
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error('Erreur lors de la génération des tâches:', error);
      throw error;
    }
  }
  /**
   * Analyse la charge de travail actuelle de l'utilisateur
   */
  static async analyzeWorkload(settings: AISettings, appState: AppState): Promise<string> {
    try {
      const appData = getAppDataSummary(appState);
      const allTasks = appState.projects.flatMap(p => p.tasks || []).filter(t => t.status !== 'done');

      // Grouper les tâches par date d'échéance
      const workloadByDay: Record<string, { count: number, hours: number, tasks: string[] }> = {};

      allTasks.forEach(task => {
        if (!task.dueDate) return;

        const start = new Date(task.startDate || task.dueDate);
        const end = new Date(task.dueDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

        const totalHours = (task.estimatedHours || 2);
        const hoursPerDay = totalHours / diffDays;

        for (let i = 0; i < diffDays; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];

          if (!workloadByDay[dateStr]) {
            workloadByDay[dateStr] = { count: 0, hours: 0, tasks: [] };
          }
          workloadByDay[dateStr].count++;
          workloadByDay[dateStr].hours += hoursPerDay;
          workloadByDay[dateStr].tasks.push(`${task.title} (${Math.round(hoursPerDay * 10) / 10}h/j)`);
        }
      });

      const prompt = `Analyse cette charge de travail et préviens-moi si des jours sont surchargés (plus de 7h/jour) ou si des échéances semblent impossibles à tenir.
      
      DONNÉES DU WORKLOAD :
      ${JSON.stringify(workloadByDay)}
      
      STATISTIQUES GLOBALES :
      ${JSON.stringify(appData.stats)}
      
      Réponds par une analyse concise et des recommandations concrètes pour éviter le surmenage.`;

      return await this.generateAiText(settings, prompt);
    } catch (error) {
      console.error('Erreur analyse workload:', error);
      return "Désolé, je n'ai pas pu analyser la charge de travail pour le moment.";
    }
  }

  /**
   * Estime le temps nécessaire pour une tâche en se basant sur l'historique et les dates
   */
  static async estimateTaskDuration(
    settings: AISettings,
    appState: AppState,
    taskTitle: string,
    taskDescription?: string,
    startDate?: string,
    dueDate?: string
  ): Promise<{ estimatedHours: number; suggestedDueDate?: string; reasoning: string }> {
    try {
      const completedTasks = appState.projects
        .flatMap(p => p.tasks || [])
        .filter(t => t.status === 'done' && t.completedAt);

      const historyData = completedTasks.map(t => {
        const start = new Date(t.startDate || t.createdAt);
        const end = new Date(t.completedAt!);
        const actualHours = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
        return {
          title: t.title,
          estimated: t.estimatedHours || 'N/A',
          actual: actualHours
        };
      }).slice(0, 15);

      const timeframe = (startDate && dueDate) ? ` du ${startDate} au ${dueDate}` : '';

      const prompt = `Estime le temps total de travail nécessaire (en heures) pour cette tâche :
      Titre: ${taskTitle}
      Description: ${taskDescription || 'N/A'}
      Délai prévu:${timeframe || ' Non précisé'}

      REGLES IMPORTANTES:
      1. Basse-toi sur cet historique de complétion : ${JSON.stringify(historyData)}
      2. COHERENCE TEMPORELLE: Ton estimation doit être réaliste par rapport au délai. 
         Une journée de travail standard = 8h de productivité réelle.
         Si tu estimes 100h de travail pour une tâche qui finit demain, c'est IMPOSSIBLE. 
         Dans ce cas, donne l'estimation REELLE du travail nécessaire (ex: 40h) mais suggère EXPLICITEMENT dans le 'reasoning' que le délai (dates) doit être allongé car le travail ne rentre pas dans le temps imparti.
      
      Réponds uniquement au format JSON : { "estimatedHours": nombre, "reasoning": "explication" }`;

      const response = await this.generateAiText(settings, prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const finalHours = result.estimatedHours || 2;

        let finalSuggestedDate = dueDate;

        // Logique de cohérence temporelle : si > 8h, calculer la date d'échéance suggérée
        if (finalHours > 8) {
          const start = new Date(startDate || new Date().toISOString().split('T')[0]);
          const daysNeeded = Math.ceil(finalHours / 8);
          const suggestedEnd = new Date(start);
          suggestedEnd.setDate(suggestedEnd.getDate() + (daysNeeded - 1));
          finalSuggestedDate = suggestedEnd.toISOString().split('T')[0];
        }

        return {
          estimatedHours: finalHours,
          suggestedDueDate: finalSuggestedDate,
          reasoning: result.reasoning
        };
      }
      return { estimatedHours: 2, reasoning: "Estimation par défaut (2h)" };
    } catch (error) {
      console.error('Erreur estimation prédictive:', error);
      return { estimatedHours: 2, reasoning: "Impossible d'analyser l'historique pour le moment." };
    }
  }

  static async fetchOpenRouterModels(apiKey: string): Promise<{ id: string; name: string; context_length: number; pricing: any }[]> {
    try {
      const response = await AIService.fetchWithRetry('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ProjectFlow'
        }
      }, 2);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des modèles');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erreur OpenRouter models:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des modèles disponibles auprès de Google Gemini
   */
  static async fetchGeminiModels(apiKey: string): Promise<{ id: string; name: string; context_length: number; pricing: any }[]> {
    try {
      // Pour Google Gemini, on utilise v1beta pour lister car il inclut généralement plus de modèles expérimentaux
      const response = await AIService.fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {}, 2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Erreur lors de la récupération des modèles Gemini');
      }

      const data = await response.json();
      
      // Filtrer pour ne garder que les modèles de génération de contenu (Gemini)
      // et transformer pour matcher l'interface attendue par ModelSelect
      return (data.models || [])
        .filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') && 
          m.name.startsWith('models/gemini')
        )
        .map((m: any) => ({
          id: m.name.replace('models/', ''),
          name: m.displayName,
          context_length: m.inputTokenLimit || 32768,
          pricing: { prompt: 0, completion: 0 } // Gratuit/Non spécifié dynamiquement
        }));
    } catch (error) {
      console.error('Erreur Gemini models:', error);
      throw error;
    }
  }
}

export default AIService;
