// Utilitaires pour gérer les chemins selon l'environnement de déploiement

/**
 * Détermine le préfixe de chemin pour l'environnement actuel
 * Nécessaire pour GitHub Pages qui sert depuis un sous-dossier
 */
export const getBasePath = (): string => {
  if (typeof window !== 'undefined') {
    const repositoryName = 'gestion-projet';
    // On vérifie si on est dans un sous-dossier (cas typique de GitHub Pages)
    if (window.location.pathname.startsWith(`/${repositoryName}`) || 
        window.location.hostname.includes('github.io')) {
      return `/${repositoryName}`;
    }
  }
  return '';
};

/**
 * Corrige un chemin relatif pour l'environnement actuel
 */
export const fixPath = (path: string): string => {
  if (!path || !path.startsWith('/')) return path;
  return `${getBasePath()}${path}`;
};

/**
 * Génère une URL complète pour un projet
 */
export const getProjectUrl = (projectId: string): string => {
  return `${getBasePath()}/projects/${projectId}`;
};

/**
 * Génère une URL complète pour une tâche dans un projet
 */
export const getTaskUrl = (projectId: string, taskId: string): string => {
  return `${getBasePath()}/projects/${projectId}?task=${taskId}`;
};
