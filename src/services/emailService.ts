// Déclaration du type global pour EmailJS
declare global {
  interface Window {
    emailjs: typeof import('@emailjs/browser');
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
  templateParams?: Record<string, any>;
}

// Interface pour la configuration EmailJS
export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken?: string; // Optionnel selon la méthode d'authentification
  fromName: string;
  fromEmail: string;
}

// Interface pour la réponse d'erreur EmailJS
interface EmailJsError extends Error {
  status?: number;
  text?: string;
}

export class EmailService {
  private static isInitialized = false;

  // Initialisation d'EmailJS
  private static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Charger la bibliothèque EmailJS si elle n'est pas déjà chargée
      if (typeof window.emailjs === 'undefined') {
        await this.loadEmailJs();
      }
      
      // Vérifier que emailjs est bien disponible
      if (!window.emailjs) {
        throw new Error('La bibliothèque EmailJS n\'a pas pu être chargée correctement');
      }
      
      // Initialiser avec une clé vide (sera fournie à chaque envoi)
      window.emailjs.init('');
      this.isInitialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation d\'EmailJS:', error);
      throw new Error('Impossible d\'initialiser le service EmailJS: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Méthode pour envoyer un email via EmailJS
  static async sendEmail(
    options: EmailOptions, 
    config: EmailJsConfig
  ): Promise<{ success: boolean; message: string; response?: any; error?: any }> {
    try {
      // Vérifier que les paramètres requis sont présents
      if (!config.serviceId || !config.templateId || !config.userId) {
        throw new Error('Configuration EmailJS incomplète. Vérifiez le Service ID, Template ID et User ID.');
      }

      // Vérifier que l'email de destination est valide
      const toEmail = Array.isArray(options.to) ? options.to[0] : options.to;
      if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
        throw new Error('Adresse email de destination invalide');
      }

      // Initialiser EmailJS (chargement de la bibliothèque si nécessaire)
      await this.initialize();

      // Préparer les paramètres du template
      const templateParams = {
        to_email: toEmail,
        to_name: options.templateParams?.to_name || 'Utilisateur',
        from_name: options.fromName || config.fromName || 'Gestion de Projet',
        from_email: options.from || config.fromEmail || 'noreply@votredomaine.com',
        subject: options.subject || 'Sans objet',
        message: options.html || options.text || '',
        ...options.templateParams
      };

      console.log('Envoi d\'email avec les paramètres:', {
        serviceId: config.serviceId,
        templateId: options.templateId || config.templateId,
        templateParams,
        userId: config.userId,
        hasAccessToken: !!config.accessToken
      });

      // Envoyer l'email avec la nouvelle API EmailJS v3+
      try {
        const response = await window.emailjs.send(
          config.serviceId,
          options.templateId || config.templateId,
          templateParams,
          {
            publicKey: config.userId,
            // Le token privé est optionnel et rarement nécessaire côté client
            ...(config.accessToken && { privateKey: config.accessToken })
          }
        );

        console.log('Réponse EmailJS:', response);
        return { 
          success: true, 
          message: 'Email envoyé avec succès',
          response: response as any // Type assertion pour éviter les erreurs de type
        };
      } catch (emailError) {
        console.error('Erreur EmailJS détaillée:', emailError);
        throw new Error(this.getErrorMessage(emailError));
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi de l\'email',
        error: error as any // Type assertion pour éviter les erreurs de type
      };
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
        console.log('EmailJS déjà chargé');
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
            console.log('EmailJS chargé avec succès');
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

  // Méthode utilitaire pour générer le contenu HTML d'un rapport
  static generateReportEmail(report: any, userProfile: any): string {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Signature de l'utilisateur
    const userSignature = userProfile?.signature || 
      `${userProfile?.name || 'Équipe Gestion de Projet'}<br>${userProfile?.position || ''}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${report.title || 'Rapport d\'activité'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .task { margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #4f46e5; }
          .task-title { font-weight: bold; margin-bottom: 5px; }
          .task-meta { font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.title || 'Rapport d\'activité'}</h1>
          <p>Période du ${formatDate(report.startDate)} au ${formatDate(report.endDate)}</p>
        </div>
        
        <div class="content">
          ${report.content || ''}
          
          <div class="signature">
            <p>Cordialement,<br>${userSignature}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Cet email a été généré automatiquement par l'application Gestion de Projet.</p>
          <p>© ${new Date().getFullYear()} Gestion de Projet. Tous droits réservés.</p>
        </div>
      </body>
      </html>
    `;
  }
}
