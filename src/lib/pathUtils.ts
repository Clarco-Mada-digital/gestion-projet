// Utilitaires pour gérer les chemins selon l'environnement de déploiement

/**
 * Détermine le préfixe de chemin pour l'environnement actuel
 * Nécessaire pour GitHub Pages qui sert depuis un sous-dossier
 */
export const getBasePath = (): string => {
  // Vérifier si on est sur GitHub Pages
  if (typeof window !== 'undefined') {
    const isGitHubPages = window.location.hostname === 'clarco-mada-digital.github.io';
    return isGitHubPages ? '/gestion-projet' : '';
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
