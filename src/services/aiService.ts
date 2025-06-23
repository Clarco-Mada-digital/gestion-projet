import { AISettings } from '../types';

type AIMessage = {
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
  static async testConnection(settings: AISettings, message: string = 'Test de connexion'): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(provider === 'openrouter' && { 'HTTP-Referer': window.location.origin }),
        },
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
        message: `Connexion réussie avec ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'}`,
        data: result
      };
    } catch (error: unknown) {
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

  static async generateText(
    settings: AISettings,
    messages: AIMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(provider === 'openrouter' && { 'HTTP-Referer': window.location.origin }),
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens || settings.maxTokens || 1000,
          temperature: options.temperature !== undefined 
            ? options.temperature 
            : settings.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `Erreur HTTP: ${response.status} ${response.statusText}`
        );
      }

      const data: AIResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Réponse invalide de l\'API');
      }

      return {
        success: true,
        content
      };
    } catch (error: unknown) {
      console.error('Erreur lors de la génération de texte:', error);
      
      let errorMessage = 'Erreur lors de la génération de texte';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  static async generateTask(
    settings: AISettings,
    project: Project,
    existingTitle?: string,
    existingDescription?: string
  ): Promise<Partial<Task>> {
    // Récupérer les tâches existantes du projet
    const existingTasks = project.tasks?.map(task => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags
    })) || [];
    
    // Préparer la liste des tâches existantes pour le prompt
    const existingTasksText = existingTasks.length > 0
      ? `Tâches existantes dans le projet (à ne pas dupliquer) :\n` +
        existingTasks
          .map((task, index) => 
            `${index + 1}. "${task.title}" (${task.status}) - Priorité: ${task.priority}` + 
            (task.tags?.length ? ` - Tags: ${task.tags.join(', ')}` : '') +
            (task.description ? `\n   Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}` : '')
          )
          .join('\n') + '\n\n'
      : '';
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

      // Créer un prompt détaillé pour la génération de tâche
      const prompt = `Génère une nouvelle tâche pour le projet "${project.name}". 

${existingTasksText}
${existingTitle ? `Titre suggéré: ${existingTitle}\n` : ''}${existingDescription ? `Description: ${existingDescription}\n` : ''}

Instructions importantes :
- Ne propose pas de tâches qui existent déjà dans le projet (voir ci-dessus)
- La tâche doit être cohérente avec les autres tâches du projet
- Propose une tâche qui suit logiquement les tâches existantes

La tâche doit inclure :
- Un titre clair et concis (différent des tâches existantes)
- Une description détaillée
- Une priorité (low, medium, high)
- Une estimation en heures
- Des sous-tâches si nécessaire
- Des tags pertinents (en français, en minuscules)

Format de réponse attendu en JSON :
{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high",
  "estimatedHours": number,
  "subTasks": ["string"],
  "tags": ["string"]
}`;

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
              content: 'Tu es un expert en gestion de projet. Ton rôle est de générer des tâches pertinentes, uniques et bien structurées qui s\'intègrent parfaitement dans le projet existant. Fais attention à ne pas proposer de tâches qui existent déjà et assure-toi que les nouvelles tâches sont cohérentes avec le contexte du projet.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erreur lors de la génération de la tâche');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error('Réponse vide de l\'API:', data);
        throw new Error('Réponse de l\'IA vide');
      }

      try {
        // Essayer d'extraire le JSON de la réponse
        let jsonContent = content.trim();
        
        // Supprimer les marqueurs de code si présents
        if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
          jsonContent = jsonContent.slice(7, -3).trim();
        } else if (jsonContent.startsWith('```') && jsonContent.endsWith('```')) {
          jsonContent = jsonContent.slice(3, -3).trim();
        }
        
        // Nettoyer le contenu JSON
        jsonContent = jsonContent.replace(/^\n+|\n+$/g, '');
        
        // Parser le JSON
        const taskData = JSON.parse(jsonContent);
        
        console.log('Tâche générée par l\'IA:', taskData);
        
        // Valider et formater la réponse
        return {
          title: taskData.title?.trim() || existingTitle?.trim() || 'Nouvelle tâche',
          description: taskData.description?.trim() || existingDescription?.trim() || '',
          priority: taskData.priority && ['low', 'medium', 'high'].includes(taskData.priority.toLowerCase()) 
            ? taskData.priority.toLowerCase() 
            : 'medium',
          estimatedHours: Number(taskData.estimatedHours) || 2,
          subTasks: Array.isArray(taskData.subTasks) 
            ? taskData.subTasks
                .filter((st: any) => st && (typeof st === 'string' || st.title))
                .map((st: any) => ({
                id: crypto.randomUUID(),
                title: typeof st === 'string' ? st : st.title,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }))
            : [],
          tags: Array.isArray(taskData.tags) 
            ? taskData.tags.filter((tag: any) => tag && typeof tag === 'string')
            : [],
        };
      } catch (error) {
        console.error('Erreur lors du parsing de la réponse JSON:', error);
        console.error('Contenu de la réponse:', content);
        throw new Error(`Erreur lors de l'analyse de la réponse de l'IA: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la tâche:', error);
      throw error;
    }
  }
}

export default AIService;
