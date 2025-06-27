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

      // Vérifier et valider les adresses email des destinataires
      const toEmails = Array.isArray(options.to) ? options.to : [options.to];
      
      // Valider chaque adresse email
      const invalidEmails = toEmails.filter(email => {
        const trimmedEmail = email.trim();
        return !trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
      });
      
      if (invalidEmails.length > 0) {
        throw new Error(`Adresse(s) email(s) de destination invalide(s) : ${invalidEmails.join(', ')}`);
      }
      
      // Utiliser la première adresse pour le champ to_email (compatibilité avec les templates)
      const toEmail = toEmails[0].trim();

      // Initialiser EmailJS (chargement de la bibliothèque si nécessaire)
      await this.initialize();

      // Préparer les paramètres du template
      const templateParams = {
        to_email: toEmail, // Première adresse pour la compatibilité
        to_emails: toEmails, // Toutes les adresses pour référence
        to_name: options.templateParams?.to_name || toEmails[0].split('@')[0],
        from_name: options.fromName || config.fromName || 'Gestion de Projet',
        from_email: options.from || config.fromEmail || 'noreply@votredomaine.com',
        subject: options.subject || 'Sans objet',
        message: options.text || '',
        html: options.html || '',
        // Inclure tous les paramètres personnalisés du template
        ...(options.templateParams || {})
      };
      
      // S'assurer que les champs essentiels ne sont pas écrasés par des valeurs vides
      if (!templateParams.to_email) templateParams.to_email = toEmail;
      if (!templateParams.from_email) templateParams.from_email = options.from || config.fromEmail || 'noreply@votredomaine.com';
      if (!templateParams.from_name) templateParams.from_name = options.fromName || config.fromName || 'Gestion de Projet';

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
    
    // Nettoyer le contenu HTML pour la version texte
    const textContent = (report.content || '')
      .replace(/<[^>]*>?/gm, '') // Supprimer les balises HTML
      .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
      .trim();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${report.title || 'Rapport'}</title>
        <style type="text/css">
          /* Styles de base pour la compatibilité email */
          body, #bodyTable, #bodyCell { height: 100% !important; margin: 0; padding: 0; width: 100% !important; }
          table { border-collapse: collapse; }
          img, a img { border: 0; outline: none; text-decoration: none; }
          h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
          p { margin: 1em 0; }
          
          /* Styles spécifiques */
          .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
          
          .header { 
            background-color: #4f46e5; 
            color: #ffffff; 
            padding: 25px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            line-height: 1.3; 
            color: #ffffff;
          }
          
          .header p { 
            margin: 10px 0 0; 
            font-size: 16px; 
            opacity: 0.9; 
            color: #e0e7ff;
          }
          
          .content { 
            padding: 25px 20px; 
            background-color: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-top: none;
            line-height: 1.6;
            color: #374151;
          }
          
          .footer { 
            margin-top: 20px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            font-size: 12px; 
            color: #6b7280;
            line-height: 1.5;
          }
          
          .signature { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            color: #4b5563;
          }
          
          .signature p { 
            margin: 5px 0; 
            line-height: 1.5;
          }
          
          .signature .name {
            font-weight: 600;
            color: #1f2937;
          }
          
          .signature .position {
            font-style: italic;
            color: #4b5563;
          }
          
          .signature .contact {
            color: #6b7280;
            font-size: 13px;
          }
          
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
            }
            .content, .header {
              padding: 15px !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" valign="top">
              <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600">
                <!-- En-tête -->
                <tr>
                  <td class="header">
                    <h1>${report.title || 'Rapport d\'activité'}</h1>
                    <p>Période du ${startDate} au ${endDate}</p>
                  </td>
                </tr>
                
                <!-- Contenu principal -->
                <tr>
                  <td class="content">
                    <!-- Contenu du rapport -->
                    <div style="margin-bottom: 20px;">
                      ${report.content || '<p>Aucun contenu disponible.</p>'}
                    </div>
                    
                    <!-- Signature -->
                    <div class="signature">
                      <p class="name">${userName}</p>
                      ${userPosition ? `<p class="position">${userPosition}</p>` : ''}
                      ${userEmail ? `<p class="contact">${userEmail}</p>` : ''}
                      ${userPhone ? `<p class="contact">${userPhone}</p>` : ''}
                    </div>
                  </td>
                </tr>
                
                <!-- Pied de page -->
                <tr>
                  <td class="footer">
                    <p style="margin: 0 0 5px 0;">
                      Cet email a été généré automatiquement par l'application Gestion de Projet.
                    </p>
                    <p style="margin: 0 0 5px 0; font-size: 11px; color: #9ca3af;">
                      Généré le ${generatedDate}
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                      © ${now.getFullYear()} Gestion de Projet. Tous droits réservés.
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
