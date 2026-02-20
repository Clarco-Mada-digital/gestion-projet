import { AISettings, Project, Task, SubTask } from '../types';
import { loadDocumentation } from '../utils/documentationLoader';
import { getAppDataSummary, formatAppDataForAI } from './appDataService';
import { AppState } from '../context/AppContext';

export interface GeneratedSubTask {
  title: string;
  description?: string;
  group?: string; // Groupe optionnel pour l'organisation
}

export type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type AIResponse = {
  choices: {
    message: {
      content: string;
      reasoning?: string;
    };
  }[];
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
   * Nettoie le contenu de la réponse IA en supprimant les blocs de réflexion (DeepSeek, etc.)
   */
  private static cleanContent(content: string): string {
    if (!content) return '';
    // Supprimer les balises <think>...</think>, <thought>...</thought>, <reasoning>...</reasoning>
    // et leur contenu (cas des modèles CoT comme DeepSeek-R1, o1, etc.)
    return content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
      .trim();
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

2. **Analyste de Données Personnel** : Utilise le contexte utilisateur ci-dessous pour répondre aux questions sur SES projets et tâches.
   - Donne des conseils sur la gestion de son temps.
   - Identifie les projets qui stagnent.
   - Suggère des priorités basées sur les échéances proches.

## DOCUMENTATION DE RÉFÉRENCE
${documentation}

${appDataInfo}

## TES RÈGLES D'OR :
- **Salutations** : Salue l'utilisateur par son **nom** uniquement au TOUT DÉBUT de la conversation ou si vous ne vous êtes pas parlé depuis longtemps. Ne répète pas "Bonjour" ou "Salut" à chaque message d'une conversation en cours.
- **Ton** : Reste amical et professionnel.
- **Adaptation au métier** : Adapte ton vocabulaire, tes conseils et ton ton en fonction du **poste** et du **département** de l'utilisateur (Par exemple, parle de "code/déploiement" à un développeur, de "conception" à un designer, ou de "stratégie" à un manager).
- **Formatage** : Utilise le gras et les listes pour rendre tes réponses lisibles.
- **Proactivité** : Si l'utilisateur a des tâches en retard, mentionne-le gentiment de temps en temps.
- Si on te demande "Où est X ?", réfère-toi à la structure de la sidebar.
- Si tu ne trouves pas une information spécifique dans les données fournies, propose à l'utilisateur de te donner plus de détails.
- **IMPORTANT** : NE PRODUIS JAMAIS DE RÉFLEXION INTERNE OU DE BLOC "THINK" DANS TA RÉPONSE FINALE. RÉPONDS DIRECTEMENT AU CONTENU DEMANDÉ SEULEMENT.`;
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
        : aiSettings.openrouterApiKey?.trim();

      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      }

      // Utiliser un modèle adapté pour la conversation
      const model = effectiveProvider === 'openai'
        ? aiSettings.openaiModel || 'gpt-3.5-turbo'
        : aiSettings.openrouterModel || 'google/gemma-7b-it:free';

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

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
      if (effectiveProvider === 'openai' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (effectiveProvider === 'openrouter' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout après 30 secondes

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1000,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Erreur API:', errorData);
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data: AIResponse = await response.json();

        // Extraire et nettoyer le contenu
        let content = AIService.cleanContent(data.choices[0].message.content || '');

        // On n'utilise plus reasoning comme fallback automatique car il contient souvent du "bruit" (réflexion interne)
        // sauf si content est VRAIMENT vide et qu'on n'a rien d'autre, mais on le nettoie aussi
        if (!content && data.choices[0].message.reasoning) {
          content = AIService.cleanContent(data.choices[0].message.reasoning);
        }

        if (!content) {
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
        : settings.openrouterApiKey?.trim();


      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      }

      // Utiliser un modèle plus léger pour OpenRouter
      let model = effectiveProvider === 'openai'
        ? settings.openaiModel || 'gpt-3.5-turbo'
        : settings.openrouterModel || 'google/gemma-7b-it:free';


      // Gérer le modèle Auto pour OpenRouter
      if (effectiveProvider === 'openrouter' && model === 'openrouter/auto') {
        // Pour le modèle Auto, utiliser un modèle gratuit de base
        model = 'google/gemma-7b-it:free';
      }

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

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
      if (effectiveProvider === 'openai' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (effectiveProvider === 'openrouter' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const requestBody = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant concis qui aide à décomposer les tâches en sous-tâches. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ, SANS AUCUNE RÉFLEXION OU TEXTE AVANT/APRÈS.'
          },
          {
            role: 'user',
            content: `${prompt} (Génère uniquement 3-5 sous-tâches maximum, sois concis)`
          }
        ],
        temperature: 0.5,  // Réponse plus prévisible
        max_tokens: 1000,  // Augmenté pour éviter les réponses coupées
      };


      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = AIService.cleanContent(data.choices?.[0]?.message?.content || '');

      if (!content && data.choices?.[0]?.message?.reasoning) {
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

    // Instructions améliorées avec groupement et évitement de doublons
    prompt += `Génère 3-5 nouvelles sous-tâches pour cette tâche.\n`;
    prompt += `IMPORTANT:\n`;
    prompt += `- NE PAS générer de sous-tâches qui existent déjà dans la liste ci-dessus\n`;
    prompt += `- Regroupe les sous-tâches similaires par catégories logiques si possible\n`;
    prompt += `- Sois spécifique et actionnable\n`;
    prompt += `- Format JSON avec groupes optionnels:\n`;
    prompt += `{"group":"Nom du groupe","tasks":[{"title":"Sous-tâche 1","description":"..."},{"title":"Sous-tâche 2","description":"..."}]}\n`;
    prompt += `Si pas de groupe, utilise: [{"title":"Tâche 1","description":"..."},...]`;

    return prompt;
  }

  private static parseSubTasksResponse(content: string): GeneratedSubTask[] {
    try {
      // Essayer d'extraire le JSON de la réponse
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Vérifier si c'est le format avec groupes
        if (parsed.length > 0 && parsed[0].group && parsed[0].tasks) {
          // Aplatir les groupes en une liste simple de sous-tâches
          const flattenedTasks: GeneratedSubTask[] = [];
          parsed.forEach((group: any) => {
            if (group.tasks && Array.isArray(group.tasks)) {
              group.tasks.forEach((task: any) => {
                flattenedTasks.push({
                  title: task.title || 'Sous-tâche sans titre',
                  description: task.description || '',
                  group: group.group || 'Sans groupe'
                });
              });
            }
          });
          return flattenedTasks;
        }

        // Format standard (sans groupes)
        return parsed;
      }

      // Si pas de JSON valide, essayer de parser manuellement
      const lines = content.split('\n').filter(line => line.trim() !== '');

      const subTasks: GeneratedSubTask[] = [];

      for (const line of lines) {
        const match = line.match(/^[\d\-\.\s]*(.+?)(?:\.|:|$)/);
        if (match && match[1]) {
          subTasks.push({
            title: match[1].trim(),
            description: ''
          });
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
        : settings.openrouterApiKey?.trim();

      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      }

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      // Utiliser un modèle plus léger pour OpenRouter
      let model = effectiveProvider === 'openai'
        ? settings.openaiModel || 'gpt-3.5-turbo'
        : settings.openrouterModel || 'google/gemma-7b-it:free';

      // Gérer le modèle Auto pour OpenRouter
      if (effectiveProvider === 'openrouter' && model === 'openrouter/auto') {
        // Pour le modèle Auto, utiliser un modèle gratuit de base
        model = 'google/gemma-7b-it:free';
      }

      // Construire le prompt pour générer une tâche
      const prompt = `Génère une tâche pour le projet "${project.name}". ` +
        (title ? `Titre suggéré: "${title}"` : '') +
        (description ? `\nDescription suggérée: "${description}"` : '') +
        '\n\nGénère un titre et une description détaillée pour cette tâche. ' +
        'Réponds au format JSON: { "title": "...", "description": "..." }';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveProvider === 'openrouter' && { 'HTTP-Referer': window.location.origin }),
          // Ajouter l'authentification uniquement si une clé est fournie
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant qui aide à rédiger des titres et descriptions de tâches clairs et précis. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ, SANS AUCUNE RÉFLEXION OU TEXTE AVANT/APRÈS.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = AIService.cleanContent(data.choices?.[0]?.message?.content || '');

      if (!content && data.choices?.[0]?.message?.reasoning) {
        content = AIService.cleanContent(data.choices?.[0]?.message?.reasoning);
      }

      if (!content) {
        throw new Error('Réponse de l\'IA invalide');
      }

      // Essayer d'extraire le JSON de la réponse
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Impossible de parser la réponse JSON, utilisation du texte brut');
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

  static async generateAiText(settings: AISettings, prompt: string): Promise<string> {
    try {
      // Utiliser OpenRouter par défaut avec des modèles gratuits
      const effectiveProvider = settings.provider || 'openrouter';

      // Pour les modèles gratuits, ne pas exiger de clé API
      const apiKey = effectiveProvider === 'openai'
        ? settings.openaiApiKey?.trim()
        : settings.openrouterApiKey?.trim();

      // Utiliser des modèles gratuits par défaut
      const model = effectiveProvider === 'openai'
        ? settings.openaiModel || 'gpt-3.5-turbo'
        : settings.openrouterModel || 'google/gemma-7b-it:free';

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      // Préparer les en-têtes de base
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(effectiveProvider === 'openrouter' && {
          'HTTP-Referer': window.location.origin || 'http://localhost:3000',
          'X-Title': 'Gestion de Projet App'
        })
      };

      // Pour OpenAI, l'authentification est toujours requise
      if (effectiveProvider === 'openai' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      // Pour OpenRouter, n'ajouter l'authentification que si une clé valide est fournie
      else if (effectiveProvider === 'openrouter' && apiKey && apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant expert qui aide à générer des rapports professionnels. RÉPONDS DIRECTEMENT ET UNIQUEMENT AVEC LE CONTENU DU RAPPORT, SANS AUCUNE RÉFLEXION INTERNE OU COMMENTAIRES.'
            },
            {
              role: 'user',
              content: `${prompt} (Réponds de manière concise en moins de 300 mots)`
            }
          ],
          temperature: 0.5, // Réduit pour des réponses plus prévisibles
          max_tokens: 500,  // Réduit pour économiser les crédits
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `Erreur HTTP: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = AIService.cleanContent(data.choices?.[0]?.message?.content || '');

      if (!content && data.choices?.[0]?.message?.reasoning) {
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

      // Récupérer la clé API appropriée
      const apiKey = effectiveProvider === 'openai'
        ? settings.openaiApiKey?.trim()
        : settings.openrouterApiKey?.trim();

      // Définir le modèle en fonction du fournisseur
      const model = (effectiveProvider === 'openai'
        ? settings.openaiModel?.trim()
        : settings.openrouterModel?.trim()) ||
        (effectiveProvider === 'openai' ? 'gpt-3.5-turbo' : 'google/gemma-7b-it:free');

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      // Préparer les en-têtes de base
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Configuration spécifique pour OpenRouter
      if (effectiveProvider === 'openrouter') {
        // Pour OpenRouter, utiliser l'authentification uniquement si la clé est valide
        if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        // Ces en-têtes sont requis par OpenRouter
        headers['HTTP-Referer'] = window.location.origin || 'http://localhost:3000';
        headers['X-Title'] = 'Gestion de Projet App';
      }
      // Configuration pour OpenAI
      else if (effectiveProvider === 'openai' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user' as const, content: message }],
          max_tokens: 5, // Nombre minimal de tokens pour le test
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `Erreur HTTP: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      return {
        success: true,
        message: `Connexion réussie avec ${effectiveProvider === 'openai' ? 'OpenAI' : 'OpenRouter'}`,
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
        : settings.openrouterApiKey?.trim();

      // Pour OpenRouter, permettre l'utilisation sans clé API (accès limité)
      if (effectiveProvider === 'openrouter' && !apiKey) {
        // Utilisation sans clé API
      } else if (effectiveProvider === 'openai' && !apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser OpenAI');
      }

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      // Utiliser un modèle plus léger pour OpenRouter
      let model = effectiveProvider === 'openai'
        ? settings.openaiModel || 'gpt-3.5-turbo'
        : settings.openrouterModel || 'google/gemma-7b-it:free';

      // Gérer le modèle Auto pour OpenRouter
      if (effectiveProvider === 'openrouter' && model === 'openrouter/auto') {
        // Pour le modèle Auto, utiliser un modèle gratuit de base
        model = 'google/gemma-7b-it:free';
      }

      // Préparer le prompt
      let prompt = `Génère 3 à 5 tâches pertinentes pour le projet "${project.name}".`;
      if (project.description) {
        prompt += `\nDescription du projet : ${project.description}`;
      }

      if (project.tasks && project.tasks.length > 0) {
        prompt += `\nTâches déjà existantes :\n${project.tasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
      }

      prompt += '\n\nGénère les tâches au format JSON array. Retourne uniquement le JSON, pas de texte supplémentaire.';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveProvider === 'openrouter' && { 'HTTP-Referer': window.location.origin }),
          // Ajouter l'authentification uniquement si une clé est fournie
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant expert en gestion de projet qui génère des tâches pertinentes et structurées au format JSON. RÉPONDS EXCLUSIVEMENT PAR LE JSON DEMANDÉ, SANS AUCUNE RÉFLEXION OU TEXTE AVANT/APRÈS.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
      }

      const data = await response.json();

      // Extraire et nettoyer le contenu
      let content = AIService.cleanContent(data.choices?.[0]?.message?.content || '');

      if (!content && data.choices?.[0]?.message?.reasoning) {
        content = AIService.cleanContent(data.choices?.[0]?.message?.reasoning);
      }

      if (!content) {
        throw new Error('Aucun contenu généré');
      }

      // Extraire le JSON
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Tentative de parse directe si le regex échoue mais que le contenu ressemble à du JSON
      try {
        return JSON.parse(content);
      } catch (e) {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la génération des tâches:', error);
      throw error;
    }
  }
  static async fetchOpenRouterModels(apiKey: string): Promise<{ id: string; name: string; context_length: number; pricing: any }[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ProjectFlow'
        }
      });

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
}

export default AIService;
