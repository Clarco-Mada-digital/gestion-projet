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
      const prompt = this.buildStructuredPrompt(reportData, stats);

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

  private static buildStructuredPrompt(data: ReportData, stats: any): string {
    let prompt = `Tu es un expert en gestion de projet qui génère des rapports d'activité professionnels et structurés.\n\n`;

    prompt += `CONTEXTE :\n`;
    prompt += `- Période d'analyse : ${data.period}\n`;
    prompt += `- Nombre de projets : ${data.projects.length}\n`;
    prompt += `- Projets identifiés : ${data.projects.map(p => p.name).join(', ')}\n\n`;

    prompt += `DONNÉES BRUTES :\n`;
    data.projects.forEach((project, pIndex) => {
      prompt += `\nPROJET ${pIndex + 1} : "${project.name}"\n`;
      prompt += `Tâches (${project.tasks.length}) :\n`;
      project.tasks.forEach((task, tIndex) => {
        const status = task.status === 'done' ? '✓' : task.status === 'in-progress' ? '→' : '○';
        prompt += `  ${tIndex + 1}. ${status} ${task.title} (${task.priority})\n`;
        if (task.subTasks && task.subTasks.length > 0) {
          task.subTasks.forEach((subTask) => {
            const subStatus = subTask.completed ? '✓' : '○';
            prompt += `    - ${subStatus} ${subTask.title}\n`;
          });
        }
      });
    });

    prompt += `\nRAPPORT ATTENDU :\n`;
    prompt += `Génère un rapport d'activité professionnel et structuré avec :\n`;
    prompt += `1. TITRE : En majuscules, percutant et professionnel (ex: "BILAN D'ACTIVITÉ OPÉRATIONNELLE")\n`;
    prompt += `2. RÉSUMÉ EXÉCUTIF : 3-4 lignes synthétisant l'avancement global\n`;
    prompt += `3. RÉALISATIONS MAJEURES : 3-5 réalisations les plus importantes par projet, avec dates et statuts\n`;
    prompt += `4. ANALYSE DE PERFORMANCE : métriques clés, répartition des priorités, taux de complétion\n`;
    prompt += `5. PERSPECTIVES : 3-5 objectifs stratégiques pour la période suivante\n`;
    prompt += `6. CONCLUSION : synthèse finale en 2-3 lignes\n\n`;

    prompt += `FORMAT JSON OBLIGATOIRE :\n`;
    prompt += `{\n`;
    prompt += `  "titre": "Titre professionnel en MAJUSCULES",\n`;
    prompt += `  "periode": "${data.period}",\n`;
    prompt += `  "date_generation": "${new Date().toLocaleDateString('fr-FR')}",\n`;
    prompt += `  "resume_executif": "Résumé synthétique en 3-4 lignes",\n`;
    prompt += `  "realisations_majeures": [\n`;
    prompt += `    {"titre": "Réalisation 1", "projet": "Nom du projet", "description": "Description brève", "date_completion": "JJ/MM/AAAA", "statut": "terminée|en_cours", "impact": "Impact sur le projet"},\n`;
    prompt += `    {"titre": "Réalisation 2", "projet": "Nom du projet", "description": "Description brève", "date_completion": "JJ/MM/AAAA", "statut": "terminée|en_cours", "impact": "Impact sur le projet"}\n`;
    prompt += `  ],\n`;
    prompt += `  "analyse_performance": {\n`;
    prompt += `    "taches_total": ${stats.totalTasks},\n`;
    prompt += `    "taches_completees": ${stats.completedTasks},\n`;
    prompt += `    "taches_en_cours": ${stats.inProgressTasks},\n`;
    prompt += `    "taches_en_attente": ${stats.pendingTasks},\n`;
    prompt += `    "taux_completion_global": ${stats.globalCompletionRate},\n`;
    prompt += `    "repartition_priorites": {\n`;
    prompt += `      "haute": ${stats.repartition_priorites.haute},\n`;
    prompt += `      "moyenne": ${stats.repartition_priorites.moyenne},\n`;
    prompt += `      "basse": ${stats.repartition_priorites.basse}\n`;
    prompt += `    },\n`;
    prompt += `    "projets_avancement": [\n`;
    stats.projets_avancement.forEach((projet: any) => {
      prompt += `      {"nom": "${projet.nom}", "taches_total": ${projet.taches_total}, "taches_completees": ${projet.taches_completees}, "taches_en_cours": ${projet.taches_en_cours}, "taux_completion": ${projet.taux_completion}}\n`;
    });
    prompt += `    ]\n`;
    prompt += `  },\n`;
    prompt += `  "perspectives": [\n`;
    prompt += `    "Objectif stratégique 1",\n`;
    prompt += `    "Objectif opérationnel 2",\n`;
    prompt += `    "Objectif d'amélioration continue 3"\n`;
    prompt += `  ],\n`;
    prompt += `  "conclusion": "Conclusion stratégique et vision d'avenir"\n`;
    prompt += `}\n\n`;

    prompt += `IMPORTANT : Réponds UNIQUEMENT avec le JSON valide, sans aucun texte avant ou après. Le rapport doit être professionnel, factuel et élégant.`;

    return prompt;
  }

  private static cleanResponse(response: string): string {
    // Nettoyer la réponse en supprimant les réflexions et salutations
    return response
      .replace(/Nous devons générer.*?[\s\S]*/, '') // Supprimer les réflexions initiales
      .replace(/Analysons les données.*?[\s\S]*/, '') // Supprimer l'analyse des données
      .replace(/Il faut.*?[\s\S]*/, '') // Supprimer les instructions
      .replace(/Note :.*?[\s\S]*/, '') // Supprimer les notes
      .replace(/---[\s\S]*Cordialement.*/, '') // Supprimer les salutations
      .replace(/Clarco Dev MADA-Digital.*/, '') // Supprimer les signatures
      .trim();
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
