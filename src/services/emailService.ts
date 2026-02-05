import { errorHandler } from '../lib/error/errorHandler';
import { ErrorContext } from '../lib/error/types';

// Déclaration du type global pour EmailJS v4
declare global {
  interface Window {
    emailjs: {
      init: (publicKey: string) => void;
      sendForm: (
        serviceId: string,
        templateId: string,
        templateParams: Record<string, unknown> | string,
        publicKey: string
      ) => Promise<{
        status: number;
        text: string;
        json?(): Promise<any>;
      }>;
      send: typeof import('@emailjs/browser').send;
    };
  }
}

// Interface pour les options d'email
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  templateId?: string;
  templateParams?: Record<string, unknown>;
}

// Interface pour la configuration EmailJS
export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken?: string;
  fromName: string;
  fromEmail: string;
}

// Types d'erreurs personnalisés
const EMAIL_ERRORS = {
  INIT_FAILED: 'Échec de l\'initialisation du service email',
  SEND_FAILED: 'Échec de l\'envoi de l\'email',
  NOT_INITIALIZED: 'Le service email n\'a pas été initialisé',
  INVALID_CONFIG: 'Configuration EmailJS invalide',
  LOAD_FAILED: 'Échec du chargement de la bibliothèque EmailJS',
} as const;

/**
 * Service de gestion des emails utilisant EmailJS
 */
export class EmailService {
  private static isInitialized = false;
  private static config: EmailJsConfig | null = null;
  private static readonly SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';

  /**
   * Initialise le service EmailJS
   * @throws {Error} Si l'initialisation échoue
   */
  private static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Vérifier que la configuration est valide
      if (!this.isValidConfig()) {
        throw new Error(EMAIL_ERRORS.INVALID_CONFIG);
      }

      // Charger la bibliothèque EmailJS si nécessaire
      if (typeof window.emailjs === 'undefined') {
        await this.loadEmailJs();
      }

      // Vérifier que emailjs est bien disponible
      if (!window.emailjs) {
        throw new Error(EMAIL_ERRORS.LOAD_FAILED);
      }

      // Initialiser EmailJS avec la configuration
      window.emailjs.init(this.config!.userId);
      this.isInitialized = true;

    } catch (error) {
      const appError = new Error(
        error instanceof Error ? error.message : EMAIL_ERRORS.INIT_FAILED,
        { cause: error }
      );

      errorHandler.handleError(appError, {
        type: 'API_ERROR',
        context: {
          source: 'EmailService.initialize',
          config: this.config ? 'configured' : 'not configured',
        },
      });

      throw appError;
    }
  }

  /**
   * Vérifie si la configuration est valide
   */
  private static isValidConfig(): boolean {
    return !!(this.config?.userId && this.config?.serviceId);
  }

  /**
   * Envoie un email via EmailJS
   * @param options Options d'envoi d'email
   * @returns Promesse résolue lorsque l'email est envoyé
   */
  public static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      return await this.sendEmailInternal(options);
    } catch (error) {
      const context: ErrorContext = {
        type: 'API_ERROR',
        context: {
          source: 'EmailService.sendEmail',
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
        },
      };

      if (error instanceof Error) {
        errorHandler.handleError(error, context);
      } else {
        errorHandler.handleError(new Error('Erreur inconnue lors de l\'envoi de l\'email'), context);
      }
      throw error;
    }
  }

  /**
   * Implémentation interne de l'envoi d'email
   */
  private static async sendEmailInternal(options: EmailOptions): Promise<void> {
    await this.initialize();

    if (!this.config) {
      throw new Error(EMAIL_ERRORS.INVALID_CONFIG);
    }

    // Préparation des paramètres du template avec plusieurs alias pour le sujet
    // pour maximiser la compatibilité avec les différents templates EmailJS
    const templateParams = {
      // Destinataire
      to_email: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      to_name: '', // Sera rempli par EmailJS si disponible

      // Expéditeur
      from_name: options.fromName || this.config.fromName,
      from_email: options.from || this.config.fromEmail,

      // Sujet (plusieurs variantes pour être sûr que l'une d'elles matche le template)
      subject: options.subject,
      email_subject: options.subject,
      object: options.subject, // "Objet" en français
      title: options.subject,
      delivery_title: options.subject,

      // Contenu
      message: options.html, // Contenu HTML complet
      content: options.html, // Alias courant
      html_content: options.html, // Autre alias courant

      // Version texte
      text: options.text || '',
      text_content: options.text || '',

      // Métadonnées
      reply_to: options.from || this.config.fromEmail,

      // Paramètres personnalisés (prennent le pas sur les défauts)
      ...options.templateParams,
    };

    try {
      // Utilisation de la méthode send de la version 4+ d'EmailJS
      await window.emailjs.send(
        this.config.serviceId,
        options.templateId || this.config.templateId,
        templateParams,
        {
          publicKey: this.config.userId,
          // Le token privé est optionnel et rarement nécessaire côté client
          ...(this.config.accessToken && { privateKey: this.config.accessToken })
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : EMAIL_ERRORS.SEND_FAILED;
      const emailError = new Error(errorMessage, { cause: error });

      errorHandler.handleError(emailError, {
        type: 'API_ERROR',
        context: {
          source: 'EmailService.sendEmailInternal',
          templateId: options.templateId || this.config.templateId,
          serviceId: this.config.serviceId,
        },
      });

      throw emailError;
    }
  }

  // Méthode utilitaire pour obtenir un message d'erreur convivial
  private static getErrorMessage(error: any): string {
    if (!error) return 'Erreur inconnue';

    // Gestion des erreurs spécifiques d'EmailJS
    if (error.status) {
      switch (error.status) {
        case 400: return 'Requête invalide. Vérifiez vos paramètres.';
        case 401: return 'Non autorisé. Vérifiez votre User ID et votre clé privée.';
        case 404: return 'Service ou modèle introuvable. Vérifiez vos IDs.';
        case 429: return 'Trop de requêtes. Veuillez réessayer plus tard.';
        case 500: return 'Erreur interne du serveur EmailJS.';
      }
    }

    // Messages d'erreur courants
    const errorMessage = error.text || error.message || String(error);

    if (errorMessage.includes('public key')) {
      return 'Clé publique (User ID) invalide. Vérifiez votre configuration.';
    }

    if (errorMessage.includes('template') || errorMessage.includes('service')) {
      return 'Service ou modèle introuvable. Vérifiez vos IDs de service et de modèle.';
    }

    return `Erreur lors de l'envoi de l'email: ${errorMessage}`;
  }

  // Méthode pour charger dynamiquement la bibliothèque EmailJS
  private static loadEmailJs(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Vérifier si le script est déjà chargé
      if (window.emailjs) {

        resolve();
        return;
      }

      const script = document.createElement('script');
      // Utiliser la dernière version stable d'EmailJS
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      script.async = true;

      script.onload = () => {
        // Laisser un peu de temps pour l'initialisation
        setTimeout(() => {
          if (window.emailjs) {

            // Initialiser avec une clé publique vide (sera fournie à chaque envoi)
            window.emailjs.init('');
            resolve();
          } else {
            console.error('EmailJS non disponible après chargement');
            reject(new Error('Échec de l\'initialisation de la bibliothèque EmailJS'));
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error('Erreur de chargement du script EmailJS:', error);
        reject(new Error('Impossible de charger le script EmailJS. Vérifiez votre connexion internet.'));
      };

      document.head.appendChild(script);
    });
  }

  // Méthode utilitaire pour formater une date au format français
  private static formatDate(dateString: string): string {
    if (!dateString) return 'Date non spécifiée';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';

      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  }

  // Méthode utilitaire pour générer le contenu HTML d'un rapport
  static generateReportEmail(report: any, userProfile: any): string {
    // Signature de l'utilisateur
    const userName = userProfile?.name || 'Équipe Gestion de Projet';
    const userPosition = userProfile?.position || '';
    const userEmail = userProfile?.email || '';
    const userPhone = userProfile?.phone || '';

    // Date de génération du rapport
    const now = new Date();
    const generatedDate = this.formatDate(now.toISOString());

    // Extraire la période du rapport si disponible
    const startDate = report.startDate ? this.formatDate(report.startDate) : 'Non spécifiée';
    const endDate = report.endDate ? this.formatDate(report.endDate) : 'Maintenant';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${report.title || 'Delivery'}</title>
        <style type="text/css">
          /* Styles de base pour la compatibilité email */
          body, #bodyTable, #bodyCell { height: 100% !important; margin: 0; padding: 0; width: 100% !important; background-color: #f3f4f6; }
          table { border-collapse: collapse; }
          
          /* Styles du conteneur optimisés */
          .email-container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          }
          
          .header { 
            background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); 
            padding: 40px 30px; 
            text-align: center; 
          }
          
          .header-title { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .header-period { 
            margin: 10px 0 0; 
            font-size: 14px; 
            color: rgba(255, 255, 255, 0.9);
            background-color: rgba(255, 255, 255, 0.2);
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
          }
          
          .content { 
            padding: 40px 30px; 
            color: #1f2937;
            line-height: 1.6;
          }
          
          .content h2 {
            color: #111827;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
          }
          
          .report-body {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            font-size: 15px;
            color: #374151;
          }
          
          .signature-box { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
          }
          
          .signature-name {
            font-weight: 700;
            color: #111827;
            font-size: 16px;
            margin-bottom: 4px;
          }
          
          .signature-role {
            color: #4f46e5;
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 12px;
          }
          
          .contact-info {
            font-size: 13px;
            color: #6b7280;
            margin: 2px 0;
          }
          
          .footer { 
            background-color: #f9fafb;
            padding: 20px; 
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer-text {
            margin: 0; 
            font-size: 12px; 
            color: #9ca3af;
          }
          
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; margin: 0 !important; border-radius: 0; }
            .header, .content { padding: 25px 20px !important; }
            .header-title { font-size: 24px !important; }
          }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" height="100%">
          <tr>
            <td align="center" valign="top" style="padding: 20px 0;">
              <!-- Container Principal -->
              <table class="email-container" border="0" cellpadding="0" cellspacing="0">
                <!-- En-tête avec Gradient -->
                <tr>
                  <td class="header">
                    <h1 class="header-title">${report.title || 'Delivery de Projet'}</h1>
                    <p class="header-period">📅 Du ${startDate} au ${endDate}</p>
                  </td>
                </tr>
                
                <!-- Contenu Principal -->
                <tr>
                  <td class="content">
                    <h2>Rapport d'Exécution</h2>
                    
                    <!-- Corps du Rapport -->
                    <div class="report-body">
                      ${report.content || '<p>Contenu non disponible.</p>'}
                    </div>
                    
                    <!-- Signature Professionnelle -->
                    <div class="signature-box">
                      <p style="margin-bottom: 15px;">Cordialement,</p>
                      <div class="signature-name">${userName}</div>
                      ${userPosition ? `<div class="signature-role">${userPosition}</div>` : ''}
                      ${userEmail ? `<div class="contact-info">📧 ${userEmail}</div>` : ''}
                      ${userPhone ? `<div class="contact-info">📱 ${userPhone}</div>` : ''}
                    </div>
                  </td>
                </tr>
                
                <!-- Pied de page -->
                <tr>
                  <td class="footer">
                    <p class="footer-text">
                      Ce delivery a été généré automatiquement via <strong>Gestion de Projet</strong>.
                    </p>
                    <p class="footer-text" style="margin-top: 5px;">
                      Document généré le ${generatedDate}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
