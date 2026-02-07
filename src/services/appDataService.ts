import { AppState } from '../store';

export interface AppDataSummary {
  user: {
    name: string;
    email: string;
    position?: string;
    department?: string;
  };
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    taskCount: number;
    completedTasks: number;
    isShared: boolean;
    source: string;
  }>;
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    projectName: string;
    status: string;
  }>;
}

/**
 * Récupère un résumé exhaustif des données de l'application pour l'IA
 */
export function getAppDataSummary(state: AppState): AppDataSummary {
  const now = new Date();
  const allTasks = state.projects.flatMap(p => p.tasks || []);

  // Informations utilisateur (premier utilisateur du tableau)
  const primaryUser = state.users?.[0];
  const user = {
    name: primaryUser?.name || 'Utilisateur',
    email: primaryUser?.email || '',
    position: primaryUser?.position,
    department: primaryUser?.department
  };

  // Détails de tous les projets (limité aux 20 derniers pour éviter de saturer le context, mais plus que 3)
  const sortedProjects = [...state.projects]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 20);

  const projects = sortedProjects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    taskCount: (p.tasks || []).length,
    completedTasks: (p.tasks || []).filter(t => t.status === 'done').length,
    isShared: !!p.isShared,
    source: p.source || 'local'
  }));

  // Statistiques globales
  const stats = {
    totalProjects: state.projects.length,
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(t => t.status === 'done').length,
    overdueTasks: allTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length,
  };

  // Tâches à venir (dans les 7 prochains jours)
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const upcomingTasks = allTasks
    .filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate > now && dueDate <= nextWeek && t.status !== 'done';
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 10) // Augmenté à 10
    .map(t => {
      const project = state.projects.find(p => (p.tasks || []).some(task => task.id === t.id));
      return {
        id: t.id,
        title: t.title,
        dueDate: t.dueDate!,
        projectName: project?.name || 'Projet inconnu',
        status: t.status
      };
    });

  return {
    user,
    projects,
    stats,
    upcomingTasks
  };
}

/**
 * Formate les données de l'application en un texte lisible pour l'IA
 */
export function formatAppDataForAI(data: AppDataSummary): string {
  let result = '## PROFIL UTILISATEUR\n';
  result += `- Nom : ${data.user.name}\n`;
  if (data.user.position) result += `- Poste : ${data.user.position}\n`;
  if (data.user.department) result += `- Département/Secteur : ${data.user.department}\n`;
  result += '\n## ÉTAT DE VOTRE ESPACE DE TRAVAIL\n\n';

  // Statistiques globales
  result += '### Statistiques Globales\n';
  result += `- Total de projets: ${data.stats.totalProjects}\n`;
  result += `- Total de tâches: ${data.stats.totalTasks}\n`;
  result += `- Tâches terminées: ${data.stats.completedTasks} (${Math.round((data.stats.completedTasks / data.stats.totalTasks) * 100) || 0}%)\n`;
  result += `- Tâches en retard: ${data.stats.overdueTasks}\n\n`;

  // Liste des projets
  if (data.projects.length > 0) {
    result += '### Vos Projets (Détails)\n';
    data.projects.forEach(project => {
      const progress = project.taskCount > 0 ? Math.round((project.completedTasks / project.taskCount) * 100) : 0;
      result += `- **${project.name}** : Statut: ${project.status}, Tâches: ${project.completedTasks}/${project.taskCount} (${progress}%), Source: ${project.source}${project.isShared ? ' (Partagé)' : ''}\n`;
      if (project.description) {
        result += `  *Description: ${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}*\n`;
      }
    });
    result += '\n';
  }

  // Tâches à venir
  if (data.upcomingTasks.length > 0) {
    result += '### Échéances Proches (7 jours)\n';
    data.upcomingTasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      result += `- ${task.title} (le ${dueDate.toLocaleDateString('fr-FR')}, Projet: ${task.projectName})\n`;
    });
  }

  return result;
}
