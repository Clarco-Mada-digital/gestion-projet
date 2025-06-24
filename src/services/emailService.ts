// Interface pour les options d'email
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string; // Version texte de l'email
  from?: string;
  fromName?: string;
  templateId?: string; // ID du modèle EmailJS (optionnel)
  templateParams?: Record<string, any>; // Paramètres du modèle (optionnel)
}

// Interface pour la configuration EmailJS
export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken: string;
  fromName: string;
  fromEmail: string;
}

export class EmailService {
  // Méthode pour envoyer un email via EmailJS
  static async sendEmail(
    options: EmailOptions, 
    config: EmailJsConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Vérifier que les paramètres requis sont présents
      if (!config.serviceId || !config.templateId || !config.userId || !config.accessToken) {
        throw new Error('Configuration EmailJS incomplète');
      }

      // Préparer les données pour EmailJS
      const templateParams = {
        to_email: Array.isArray(options.to) ? options.to[0] : options.to,
        to_name: '', // Peut être personnalisé via options.templateParams
        from_name: options.fromName || config.fromName || 'Gestion de Projet',
        from_email: options.from || config.fromEmail,
        subject: options.subject,
        message: options.html,
        ...options.templateParams // Permet de surcharger les paramètres ci-dessus
      };

      // Vérifier si la bibliothèque EmailJS est chargée
      if (typeof window.emailjs === 'undefined') {
        // Charger dynamiquement la bibliothèque EmailJS si elle n'est pas déjà chargée
        await this.loadEmailJs();
      }

      // Initialiser EmailJS avec l'ID utilisateur
      window.emailjs.init(config.userId);

      // Envoyer l'email
      const response = await window.emailjs.send(
        config.serviceId,
        options.templateId || config.templateId,
        templateParams,
        config.accessToken
      );

      if (response.status !== 200) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }

      return { success: true, message: 'Email envoyé avec succès' };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email'
      };
    }
  }

  // Méthode pour charger dynamiquement la bibliothèque EmailJS
  private static async loadEmailJs(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Vérifier si le script est déjà chargé
      if (document.querySelector('script[src*="emailjs-com"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.async = true;
      
      script.onload = () => {
        // Vérifier que l'objet emailjs est bien disponible
        if (window.emailjs) {
          resolve();
        } else {
          reject(new Error('Échec du chargement de la bibliothèque EmailJS'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Échec du chargement du script EmailJS'));
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
