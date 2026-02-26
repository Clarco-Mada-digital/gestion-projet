import { AISettings } from '../types';
import { AIService } from './aiService';

interface ReportData {
  titre: string;
  projects: Array<{
    name: string;
    tasks: Array<{
      title: string;
      status: string;
      priority: string;
      completedAt?: string;
      subTasks?: Array<{
        title: string;
        completed: boolean;
      }>;
    }>;
  }>;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  globalCompletionRate: number;
  period: string;
}

interface GeneratedReport {
  titre: string;
  periode: string;
  date_generation: string;
  resume_executif: string;
  realisations_majeures: Array<{
    titre: string;
    projet: string;
    description: string;
    date_completion?: string;
    statut: string;
    impact: string;
  }>;
  analyse_performance: {
    taches_total: number;
    taches_completees: number;
    taches_en_cours: number;
    taches_en_attente: number;
    taux_completion_global: number;
    repartition_priorites: {
      haute: number;
      moyenne: number;
      basse: number;
    };
    projets_avancement: Array<{
      nom: string;
      taches_total: number;
      taches_completees: number;
      taches_en_cours: number;
      taux_completion: number;
    }>;
  };
  perspectives: string[];
  conclusion: string;
}

export class ReportService {
  static async generateProfessionalReport(
    reportData: ReportData,
    settings: AISettings
  ): Promise<string> {
    try {
      // Utiliser les modèles configurés par l'utilisateur
      const openrouterModel = settings.openrouterModel || 'meta-llama/llama-3.1-8b-instruct:free';
      const openaiModel = settings.openaiModel || 'gpt-3.5-turbo';

      // Calculer les statistiques
      const stats = this.calculateStatistics(reportData);

      // Préparer le prompt structuré
      const prompt = this.buildStructuredPrompt(reportData);

      // Générer le rapport avec le modèle approprié
      const reportSettings = {
        ...settings,
        openrouterModel: openrouterModel,
        openaiModel: openaiModel
      };
      const response = await AIService.generateAiText(reportSettings, prompt);

      // Nettoyer et parser la réponse
      const cleanedResponse = this.cleanResponse(response);

      // Tenter de parser le JSON
      const report = this.parseReportResponse(cleanedResponse);

      // Si le parsing échoue, générer un rapport formaté
      if (!report) {
        return this.generateFormattedReport(reportData, stats);
      }

      return this.formatReportOutput(report);

    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw new Error('Erreur lors de la génération du rapport. Veuillez réessayer.');
    }
  }

  private static calculateStatistics(data: ReportData) {
    const totalTasks = data.totalTasks;
    const completedTasks = data.completedTasks;
    const inProgressTasks = data.inProgressTasks;
    const pendingTasks = data.pendingTasks;
    const globalCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Compter les priorités
    const priorities = { haute: 0, moyenne: 0, basse: 0 };
    data.projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.priority === 'high') priorities.haute++;
        else if (task.priority === 'medium') priorities.moyenne++;
        else if (task.priority === 'low') priorities.basse++;
      });
    });

    // Calculer l'avancement par projet
    const projetsAvancement = data.projects.map(project => {
      const projectTasks = project.tasks.length;
      const projectCompleted = project.tasks.filter(t => t.status === 'done').length;
      const projectInProgress = project.tasks.filter(t => t.status === 'in-progress').length;
      const projectTaux = projectTasks > 0 ? Math.round((projectCompleted / projectTasks) * 100) : 0;

      return {
        nom: project.name,
        taches_total: projectTasks,
        taches_completees: projectCompleted,
        taches_en_cours: projectInProgress,
        taux_completion: projectTaux
      };
    });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      globalCompletionRate,
      repartition_priorites: priorities,
      projets_avancement: projetsAvancement
    };
  }

  private static buildStructuredPrompt(data: ReportData): string {
    let prompt = `Tu es un expert en gestion de projet. Ta tâche est de générer un rapport d'activité professionnel au format Markdown.\n\n`;

    prompt += `DONNÉES DU PROJET :\n`;
    prompt += `- Période : ${data.period}\n`;

    data.projects.forEach((project) => {
      prompt += `\nPROJET : "${project.name}"\n`;

      const doneTasks = project.tasks.filter(t => t.status === 'done' || t.status === 'completed');
      if (doneTasks.length > 0) {
        prompt += `TÂCHES EFFECTUÉES :\n`;
        doneTasks.forEach((task) => {
          prompt += `- [x] ${task.title}\n`;
          if (task.subTasks && task.subTasks.length > 0) {
            task.subTasks.forEach((st) => {
              prompt += `  ${st.completed ? '[x]' : '[ ]'} ${st.title}\n`;
            });
          }
        });
      }

      const nextTasks = project.tasks.filter(t => t.status !== 'done' && t.status !== 'completed');
      if (nextTasks.length > 0) {
        prompt += `TÂCHES SUIVANTES :\n`;
        nextTasks.forEach((task) => {
          prompt += `- [ ] ${task.title} (${task.status})\n`;
          if (task.subTasks && task.subTasks.length > 0) {
            task.subTasks.forEach((st) => {
              prompt += `  ${st.completed ? '[x]' : '[ ]'} ${st.title}\n`;
            });
          }
        });
      }
    });

    prompt += `\nCONSIGNES DE RÉDACTION :\n`;
    prompt += `1. Format : Markdown professionnel avec titres (# et ##).\n`;
    prompt += `2. Structure : Un titre, une section "Tâches effectuées", et une section "Tâches suivantes".\n`;
    prompt += `3. Style : Direct, factuel, sans fioritures ni analyses stratégiques.\n`;
    prompt += `4. IMPORTANT : Pas de résumé exécutif, pas de perspectives, pas de conclusion analytique.\n`;
    prompt += `5. Pas de blabla d'IA ("Voici le rapport", etc.).\n\n`;

    prompt += `Génère uniquement le contenu Markdown du rapport.`;

    return prompt;
  }

  private static cleanResponse(response: string): string {
    let cleaned = response.trim();

    // Si la réponse contient un titre Markdown, on commence à partir de là
    if (cleaned.includes('# ')) {
      cleaned = cleaned.substring(cleaned.indexOf('# '));
    }

    // Supprimer les préambules courants
    cleaned = cleaned
      .replace(/^(Préliminaire|Premièrement|Voici|D'après|Analysons|Nous devons).*?\n/gi, '')
      .replace(/^(L'analyse des données|Le rapport suivant).*?\n/gi, '')
      .trim();

    // Supprimer les réflexions entre balises de pensée si présentes (ex: <thought>...</thought>)
    cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();

    return cleaned;
  }

  private static parseReportResponse(response: string): GeneratedReport | null {
    try {
      // Chercher un JSON dans la réponse
      const jsonMatch = response.match(/\{[\s\S]*\{.*\}[\s\S]*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Tenter de parser directement si ça ressemble à du JSON
      if (response.trim().startsWith('{') && response.trim().endsWith('}')) {
        return JSON.parse(response);
      }

      return null;
    } catch (error) {
      console.error('Erreur lors du parsing du rapport:', error);
      return null;
    }
  }

  private static generateFormattedReport(data: ReportData, stats: any): string {
    const date = new Date().toLocaleDateString('fr-FR');

    let report = `${data.titre.toUpperCase()}\n\n`;
    report += `Période : ${data.period}\n`;
    report += `Date de génération : ${date}\n\n`;

    report += `RÉSUMÉ EXÉCUTIF\n`;
    report += `Au total, ${stats.completedTasks} tâches sur ${stats.totalTasks} ont été complétées (${stats.globalCompletionRate}% de taux de complétion).\n`;
    report += `Les projets "${data.projects.filter(p => stats.projets_avancement.find((av: any) => av.nom === p.name)?.taux_completion > 50).map(p => p.name).join('", "')}" montrent un avancement significatif.\n\n`;

    report += `RÉALISATIONS MAJEURES\n`;
    data.projects.forEach(project => {
      const completedTasks = project.tasks.filter(t => t.status === 'done');
      if (completedTasks.length > 0) {
        report += `\n${project.name} :\n`;
        completedTasks.slice(0, 3).forEach((task) => {
          const date = task.completedAt ? new Date(task.completedAt).toLocaleDateString('fr-FR') : 'En cours';
          report += `• ${task.title} (${date})\n`;
        });
      }
    });

    report += `\nANALYSE DE PERFORMANCE\n`;
    report += `Répartition des priorités : Haute (${stats.repartition_priorites.haute}), Moyenne (${stats.repartition_priorites.moyenne}), Basse (${stats.repartition_priorites.basse})\n`;
    report += `Taux de complétion global : ${stats.globalCompletionRate}%\n\n`;

    report += `PERSPECTIVES\n`;
    report += `• Optimiser la gestion des priorités hautes\n`;
    report += `• Accélérer la complétion des tâches en cours\n`;
    report += `• Renforcer le suivi des délais\n\n`;

    report += `CONCLUSION\n`;
    report += `L'activité globale montre une progression stable avec ${stats.globalCompletionRate}% de complétion.\n`;
    report += `Les prochains objectifs devraient se concentrer sur l'optimisation des processus et l'accélération des livrables.\n`;

    return report;
  }

  private static formatReportOutput(report: GeneratedReport): string {
    return JSON.stringify(report, null, 2);
  }
}
