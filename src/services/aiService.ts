import { AISettings, Project, Task, SubTask } from '../types';

export interface GeneratedSubTask {
  title: string;
  description?: string;
}

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
  static async generateSubTasksWithAI(
    settings: AISettings,
    project: Project,
    task: Task,
    existingSubTasks: SubTask[] = []
  ): Promise<GeneratedSubTask[]> {
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

      // Préparer le prompt
      const prompt = this.buildSubTaskPrompt(project, task, existingSubTasks);
      
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
              content: 'Tu es un assistant qui aide à décomposer les tâches en sous-tâches logiques et bien structurées.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
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
    let prompt = `Projet: ${project.name}\n`;
    prompt += `Tâche: ${task.title}\n`;
    if (task.description) {
      prompt += `Description: ${task.description}\n\n`;
    }
    
    if (existingSubTasks.length > 0) {
      prompt += 'Sous-tâches existantes :\n';
      existingSubTasks.forEach((st, index) => {
        prompt += `${index + 1}. ${st.title}${st.completed ? ' (terminée)' : ''}\n`;
      });
      prompt += '\n';
    }

    prompt += `Génère entre 3 et 10 sous-tâches pour cette tâche, en tenant compte du contexte du projet et des sous-tâches existantes. \n`;
    prompt += `Format de réponse attendu (JSON) :\n`;
    prompt += `[\n  {\n    \"title\": \"Titre de la sous-tâche 1\",\n    \"description\": \"Description optionnelle\"\n  },\n  ...\n]`;

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
      return {
        title: title || 'Tâche générée',
        description: description || 'Une erreur est survenue lors de la génération avec IA.'
      };
    }
  }

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
