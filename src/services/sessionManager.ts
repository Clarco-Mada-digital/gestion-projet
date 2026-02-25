/**
 * Gestionnaire de session pour éviter les déconnexions fréquentes
 */

export class SessionManager {
  private static instance: SessionManager;
  private refreshInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Démarrer le monitoring de session
   */
  startSessionMonitoring(): void {
    // Nettoyer l'intervalle existant
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Rafraîchir le token toutes les 45 minutes (avant expiration)
    this.refreshInterval = setInterval(async () => {
      await this.refreshSession();
    }, 45 * 60 * 1000); // 45 minutes

    console.log('[SessionManager] Monitoring démarré - rafraîchissement toutes les 45 minutes');
  }

  /**
   * Arrêter le monitoring
   */
  stopSessionMonitoring(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('[SessionManager] Monitoring arrêté');
    }
  }

  /**
   * Rafraîchir la session Firebase
   */
  private async refreshSession(): Promise<void> {
    try {
      // Importer dynamiquement pour éviter les dépendances circulaires
      const { firebaseService } = await import('./collaboration/firebaseService');
      const currentUser = await firebaseService.getCurrentUser();

      if (currentUser) {
        // Forcer le rafraîchissement du token
        await currentUser.getIdToken(true);
        console.log('[SessionManager] Token rafraîchi avec succès');
      } else {
        console.warn('[SessionManager] Aucun utilisateur connecté');
      }
    } catch (error) {
      console.error('[SessionManager] Erreur lors du rafraîchissement:', error);
    }
  }
}

export const sessionManager = SessionManager.getInstance();
