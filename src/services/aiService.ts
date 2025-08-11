import { AISettings, Project, Task, SubTask } from '../types';
import { loadDocumentation } from '../utils/documentationLoader';
import { getAppDataSummary, formatAppDataForAI } from './appDataService';
import { AppState } from '../store/types';

export interface GeneratedSubTask {
  title: string;
  description?: string;
}

export type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type AIResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};

export class AIService {
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
   * Prépare le prompt système avec la documentation et le contexte utilisateur
   */
  private static async prepareSystemPrompt(_aiSettings: AISettings, appState?: AppState): Promise<string> {
    let documentation = '';
    try {
      documentation = await loadDocumentation();
      documentation = documentation
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_`~]+/g, '')
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
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    }

    return `Tu es un assistant expert pour l'application de Gestion de Projet. 
    Tu as accès aux informations sur les projets et tâches de l'utilisateur pour fournir des réponses personnalisées.
    
    ## DOCUMENTATION DE L'APPLICATION
    ${documentation}
    
    ${appDataInfo}
    
    ## INSTRUCTIONS POUR TES RÉPONSES :
    - Sois concis et précis
    - Fournis des étapes claires et numérotées quand c'est pertinent
    - Utilise les informations du contexte utilisateur pour personnaliser tes réponses
    - Si on te pose une question sur un projet ou une tâche spécifique, utilise les données fournies
    - Si tu ne connais pas la réponse, dis-le simplement`;
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
        ? aiSettings.openaiApiKey 
        : aiSettings.openrouterApiKey;

      if (!apiKey) {
        throw new Error(`Clé API ${effectiveProvider} manquante`);
      }

      // Utiliser un modèle adapté pour la conversation
      const model = effectiveProvider === 'openai' 
        ? aiSettings.openaiModel || 'gpt-3.5-turbo'
        : aiSettings.openrouterModel || 'google/gemma-7b-it:free';

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      // Préparer le prompt système
      const systemPrompt = await this.prepareSystemPrompt(aiSettings, appState);
      
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
        ...(effectiveProvider === 'openrouter' && {
          'HTTP-Referer': window.location.href,
          'X-Title': 'Gestion de Projet App'
        })
      };

      // Ajouter l'authentification
      if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
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
        const content = data.choices[0].message.content;
        
        if (!content) {
          throw new Error('Réponse de l\'IA invalide');
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
        ? settings.openaiApiKey 
        : settings.openrouterApiKey;

      // Utiliser un modèle plus léger pour OpenRouter
      const model = effectiveProvider === 'openai' 
        ? settings.openaiModel || 'gpt-3.5-turbo'
        : settings.openrouterModel || 'google/gemma-7b-it:free';

      const endpoint = effectiveProvider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      // Préparer le prompt concis
      const prompt = this.buildSubTaskPrompt(project, task, existingSubTasks);
      
      // Préparer les en-têtes
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(effectiveProvider === 'openrouter' && {
          'HTTP-Referer': window.location.origin || 'http://localhost:3000',
          'X-Title': 'Gestion de Projet App'
        })
      };

      // Ajouter l'authentification uniquement si nécessaire
      if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: 'Tu es un assistant concis qui aide à décomposer les tâches en sous-tâches.'
            },
            { 
              role: 'user', 
              content: `${prompt} (Génère uniquement 3-5 sous-tâches maximum, sois concis)`
            }
          ],
          temperature: 0.5,  // Réponse plus prévisible
          max_tokens: 500,   // Réduit pour économiser les crédits
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Réponse de l\'IA invalide');
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
    
    // Lister les sous-tâches existantes de manière concise
    if (existingSubTasks.length > 0) {
      prompt += 'Sous-tâches existantes :\n';
      existingSubTasks.slice(0, 3).forEach((st, index) => {
        prompt += `- ${st.title}${st.completed ? ' ✓' : ''}\n`;
      });
      if (existingSubTasks.length > 3) prompt += `... (${existingSubTasks.length - 3} de plus)\n`;
      prompt += '\n';
    }

    // Instructions claires et concises
    prompt += `Génère 3-5 sous-tâches pour cette tâche.\n`;
    prompt += `Format JSON : [{"title":"Tâche 1","description":"..."},...]`;

    return prompt;
  }

  private static parseSubTasksResponse(content: string): GeneratedSubTask[] {
    try {
      // Essayer d'extraire le JSON de la réponse
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
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
      
      return subTasks.length > 0 ? subTasks : [{ title: 'Sous-tâche générée', description: '' }];
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
      const { provider } = settings;
      const apiKey = provider === 'openai' 
        ? settings.openaiApiKey 
        : settings.openrouterApiKey;
      
      if (!apiKey) {
        throw new Error(`Clé API ${provider} manquante`);
      }

      const endpoint = provider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      const model = provider === 'openai' 
        ? settings.openaiModel 
        : settings.openrouterModel;

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
          'Authorization': `Bearer ${apiKey}`,
          ...(provider === 'openrouter' && { 'HTTP-Referer': window.location.origin }),
        },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: 'Tu es un assistant qui aide à rédiger des titres et descriptions de tâches clairs et précis.'
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
      const content = data.choices?.[0]?.message?.content;
      
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
        ? settings.openaiApiKey 
        : settings.openrouterApiKey;
      
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
          model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant concis qui aide à générer des rapports professionnels. Sois bref et va droit au but.'
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
        throw new Error(`Erreur API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Aucune réponse générée';
      
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
        ? settings.openaiApiKey 
        : settings.openrouterApiKey;
      
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
          model,
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

  // ... autres méthodes existantes ...
}

export default AIService;
