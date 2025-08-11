import { AppState } from '../store';

interface AppDataSummary {
  projects: {
    total: number;
    active: number;
    completed: number;
    archived: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    taskCount: number;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    projectName: string;
    status: string;
  }>;
}

/**
 * Récupère un résumé des données de l'application pour l'IA
 */
export function getAppDataSummary(state: AppState): AppDataSummary {
  const now = new Date();
  
  // Statistiques des projets
  const projects = {
    total: state.projects.length,
    active: state.projects.filter(p => p.status === 'active').length,
    completed: state.projects.filter(p => p.status === 'completed').length,
    archived: state.projects.filter(p => p.status === 'archived').length,
  };

  // Statistiques des tâches
  const allTasks = state.projects.flatMap(p => p.tasks);
  const tasks = {
    total: allTasks.length,
    completed: allTasks.filter(t => t.status === 'done').length,
    pending: allTasks.filter(t => t.status !== 'done').length,
    overdue: allTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length,
  };

  // Projets récents (les 3 derniers modifiés)
  const recentProjects = [...state.projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      taskCount: p.tasks.length
    }));

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
    .slice(0, 5)
    .map(t => {
      const project = state.projects.find(p => p.tasks.some(task => task.id === t.id));
      return {
        id: t.id,
        title: t.title,
        dueDate: t.dueDate!,
        projectName: project?.name || 'Projet inconnu',
        status: t.status
      };
    });

  return {
    projects,
    tasks,
    recentProjects,
    upcomingTasks
  };
}

/**
 * Formate les données de l'application en un texte lisible pour l'IA
 */
export function formatAppDataForAI(data: AppDataSummary): string {
  let result = '## Résumé de votre espace de travail\n\n';
  
  // Résumé des projets
  result += `### Projets (${data.projects.total})\n`;
  result += `- Actifs: ${data.projects.active}\n`;
  result += `- Terminés: ${data.projects.completed}\n`;
  result += `- Archivés: ${data.projects.archived}\n\n`;
  
  // Résumé des tâches
  result += `### Tâches (${data.tasks.total})\n`;
  result += `- Terminées: ${data.tasks.completed} (${Math.round((data.tasks.completed / data.tasks.total) * 100) || 0}%)\n`;
  result += `- En attente: ${data.tasks.pending}\n`;
  result += `- En retard: ${data.tasks.overdue}\n\n`;
  
  // Projets récents
  if (data.recentProjects.length > 0) {
    result += '### Projets récents\n';
    data.recentProjects.forEach(project => {
      result += `- ${project.name} (${project.taskCount} tâches, ${project.status === 'active' ? 'actif' : project.status === 'completed' ? 'terminé' : 'archivé'})\n`;
    });
    result += '\n';
  }
  
  // Tâches à venir
  if (data.upcomingTasks.length > 0) {
    result += '### Tâches à venir (7 prochains jours)\n';
    data.upcomingTasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      result += `- ${task.title} (${dueDate.toLocaleDateString('fr-FR')}, Projet: ${task.projectName})\n`;
    });
  }
  
  return result;
}
