import { errorHandler } from '../lib/error/errorHandler';
import { ErrorContext } from '../lib/error/AppError';
import { getBasePath } from '../lib/pathUtils';

declare global {
  interface Window {
    emailjs: any;
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
  provider?: 'emailjs' | 'google';
  googleAccessToken?: string;
  threadId?: string;
  inReplyTo?: string;
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


  private static config: EmailJsConfig | null = null;



  /**
   * Envoie un email via EmailJS
   * @param options Options d'envoi d'email
   * @param config Configuration optionnelle (utilise la config chargée si non fournie)
   * @returns Promesse résolue avec le statut de l'envoi
   */
  public static async sendEmail(options: EmailOptions, config?: EmailJsConfig): Promise<{ success: boolean; message: string; messageId?: string; threadId?: string }> {
    try {
      // Si une config est passée, on l'utilise (principalement pour EmailJS)
      if (config) {
        this.config = config;
      }

      // Déterminer le provider à utiliser
      // RÈGLE : On respecte TOUJOURS le choix explicite du client dans ses paramètres.
      // La présence d'un googleAccessToken (ex: pour le Calendar) ne doit PAS forcer Gmail.
      const provider = options.provider || (this.config ? 'emailjs' : 'google');

      let result: any = null;
      if (provider === 'google') {
        // Gmail : uniquement si le client a explicitement choisi ce provider
        if (!options.googleAccessToken) {
          throw new Error('Jeton d\'accès Google manquant. Veuillez vous connecter à Gmail dans les paramètres.');
        }
        result = await this.sendViaGoogle(options);
      } else {
        // EmailJS : par défaut ou si le client a choisi EmailJS
        await this.sendEmailInternal(options);
      }

      return {
        success: true,
        message: 'Email envoyé avec succès',
        messageId: result?.realMessageId || result?.id,
        threadId: result?.threadId
      };
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      const context: ErrorContext = {
        type: 'API_ERROR',
        context: {
          source: 'EmailService.sendEmail',
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          errorMessage
        },
      };

      if (error instanceof Error) {
        errorHandler.handleError(error, context);
      } else {
        errorHandler.handleError(new Error(errorMessage), context);
      }

      return { success: false, message: errorMessage };
    }
  }

  /**
   * Implémentation interne de l'envoi d'email
   */
  private static async sendEmailInternal(options: EmailOptions): Promise<void> {
    // S'assurer que la bibliothèque est chargée
    if (typeof window.emailjs === 'undefined') {
      await this.loadEmailJs();
    }

    if (!this.config) {
      throw new Error(EMAIL_ERRORS.INVALID_CONFIG);
    }

    // Initialiser EmailJS avec la clé publique (User ID) si nécessaire
    // Dans la v4, on peut aussi le passer à l'appel send()
    if (window.emailjs && typeof window.emailjs.init === 'function') {
      window.emailjs.init(this.config.userId);
    }

    // Préparation des paramètres du template
    const toEmail = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const templateParams = {
      // Alias pour le destinataire
      to_email: toEmail,
      email: toEmail,
      to: toEmail,

      // Alias pour le nom du destinataire
      to_name: options.templateParams?.to_name || '',
      name: options.templateParams?.to_name || '',

      // Expéditeur
      from_name: options.fromName || this.config.fromName,
      from_email: options.from || this.config.fromEmail,

      // Sujet
      subject: options.subject,
      email_subject: options.subject,
      title: options.subject,

      // Contenu
      message: options.html,
      content: options.html,
      text_content: options.text || '',
      reply_to: options.from || this.config.fromEmail,

      // Paramètres personnalisés (prennent le pas sur les alias)
      ...options.templateParams,
    };

    try {
      // Utilisation de la méthode send d'EmailJS
      const response = await window.emailjs.send(
        this.config.serviceId,
        options.templateId || this.config.templateId,
        templateParams,
        this.config.userId // La clé publique peut être passée ici dans les versions récentes
      );

      if (response.status !== 200) {
        throw new Error(`Erreur EmailJS: ${response.text} (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('EmailJS send error:', error);
      throw error;
    }
  }

  /**
   * Envoie un email via l'API Gmail de Google
   */
  private static async sendViaGoogle(options: EmailOptions): Promise<{ id: string; threadId: string; realMessageId?: string }> {
    const { to, subject, html, googleAccessToken, fromName, from } = options;

    if (!googleAccessToken) {
      throw new Error('Token Google manquant');
    }

    const recipients = Array.isArray(to) ? to.join(', ') : to;
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const fromHeader = fromName ? `${fromName} <${from || 'me'}>` : (from || 'me');

    // Construction des headers RFC 2822
    const emailHeaderLines = [
      `Content-Type: text/html; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `To: ${recipients}`,
      `From: ${fromHeader}`,
      `Subject: ${utf8Subject}`,
    ];

    // Ajouter les headers IN-REPLY-TO et REFERENCES si c'est une réponse
    // IMPORTANT : C'est eux (couplé au threadId) qui informent Gmail et les autres serveurs
    // que ce message appartient formellement à la conversation.
    if (options.inReplyTo) {
      const formattedInReplyTo = options.inReplyTo.startsWith('<') 
        ? options.inReplyTo 
        : `<${options.inReplyTo}>`;
      emailHeaderLines.push(`In-Reply-To: ${formattedInReplyTo}`);
      emailHeaderLines.push(`References: ${formattedInReplyTo}`);
    }

    const email = [...emailHeaderLines, ``, html].join('\r\n');

    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Inclure threadId UNIQUEMENT s'il existe pour forcer le regroupement Gmail
    const requestBody: any = { raw: base64EncodedEmail };
    if (options.threadId) {
      requestBody.threadId = options.threadId;
    }

    try {
      // 1. Envoi de l'email
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erreur Google API (${response.status})`);
      }

      const data = await response.json();
      const sentId = data.id;
      const sentThreadId = data.threadId;

      // 2. Récupération du VRAI Message-ID assigné par le serveur de Google
      //    (Nécessite le scope gmail.readonly rajouté dans les permissions)
      let realMessageId = sentId; // Fallback par défaut sur l'ID interne
      try {
        const metadataResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${sentId}?format=metadata&metadataHeaders=Message-ID`,
          {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          }
        );
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          const pHeader = metadata.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'message-id');
          if (pHeader && pHeader.value) {
            realMessageId = pHeader.value;
            console.log('[Gmail Threading] Vrai Message-ID récupéré:', realMessageId);
          }
        }
      } catch (e) {
        console.warn('[Gmail Threading] Echec GET messages/{id}', e);
      }
      
      return {
        id: sentId,
        threadId: sentThreadId,
        realMessageId
      };
    } catch (error) {
      console.error('Gmail send error:', error);
      throw error;
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

  // Méthode utilitaire simple pour convertir le Markdown en HTML basique pour les emails
  private static markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    return markdown
      // Entêtes
      .replace(/^#### (.*$)/gim, '<h4 style="color: #1a365d; margin-top: 20px; margin-bottom: 10px; font-size: 1em; padding-bottom: 5px;">$1</h4>')
      .replace(/^### (.*$)/gim, '<h3 style="color: #1a365d; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #1a365d; margin-top: 25px; margin-bottom: 15px; font-size: 1.25em; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: #1a365d; margin-top: 30px; margin-bottom: 20px; font-size: 1.5em; text-align: center;">$1</h1>')
      // Gras
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/__(.*)__/gim, '<strong>$1</strong>')
      // Italique
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/_(.*)_/gim, '<em>$1</em>')
      // Listes à puces
      .replace(/^\s*[\-\+\*] (.*$)/gim, '<li style="margin-bottom: 5px;">$1</li>')
      // Regrouper les <li> consécutifs dans un <ul>
      .replace(/((?:<li.*<\/li>\n?)+)/gim, '<ul style="padding-left: 0; margin-bottom: 25px; list-style-type: none;">$1</ul>')
      // Checkbox [x] et [ ]
      .replace(/\[x\]/gim, '<span style="color: #10b981; font-weight: bold; margin-right: 8px;">✓</span>')
      .replace(/\[ \]/gim, '<span style="color: #9ca3af; font-weight: bold; margin-right: 8px;">○</span>')
      // Paragraphes (lignes simples)
      .split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<div style="height: 12px;"></div>';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<div')) return line;
        return `<p style="margin-bottom: 12px; color: #334155; font-size: 16px; line-height: 1.6; text-align: left;">${line}</p>`;
      }).join('\n')
      // Liens
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">$1</a>');
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
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  }

  // Méthode utilitaire pour générer le contenu HTML d'un rapport
  static generateReportEmail(report: any, _userProfile: any): string {
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
        <title>${report.title || 'Delivery de Projet'}</title>
        <style type="text/css">
          body { margin: 0; padding: 0; width: 100% !important; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .email-wrapper { background-color: #ffffff; padding: 20px; }
          .email-container { max-width: 800px; margin: 0 auto; background-color: #ffffff; text-align: left; }
          .header { padding: 0 0 30px 0; border-bottom: 2px solid #f1f5f9; margin-bottom: 30px; }
          .report-title { color: #1e293b; font-size: 28px; font-weight: 800; line-height: 1.2; margin: 0; margin-bottom: 10px; text-align: left; }
          .report-meta { display: flex; align-items: center; gap: 10px; color: #64748b; font-size: 14px; }
          .main-content { padding: 0; }
          .report-body { font-size: 16px; color: #334155; line-height: 1.7; text-align: left; }
          .public-links { margin-top: 40px; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
          .footer { padding: 40px 0; text-align: left; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; margin-top: 40px; }
          .footer p { margin: 4px 0; }
          h2 { color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 35px; margin-bottom: 15px; text-align: left; }
          h3 { color: #1e293b; font-size: 17px; font-weight: 700; margin-top: 25px; margin-bottom: 12px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <!-- Header simple et pro -->
            <div class="header">
              <h1 class="report-title">${report.title || 'Rapport d\'activité'}</h1>
              <div class="report-meta">
                <span>🗓️ Période : ${startDate} au ${endDate}</span>
                <span style="margin: 0 10px; color: #cbd5e1;">|</span>
                <span>📄 Généré le ${generatedDate}</span>
              </div>
            </div>
            
            <!-- Main Content (Aligné à gauche) -->
            <div class="main-content">
              <div class="report-body">
                ${this.markdownToHtml(report.content) || '<p>Contenu non disponible.</p>'}
              </div>

                    ${report.publicProjects && report.publicProjects.length > 0 ? `
                      <div class="public-links">
                        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 20px;">Suivi Projet en Temps réel</h3>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          ${report.publicProjects.map((prj: any) => `
                            <tr>
                              <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
                                <div style="font-weight: 700; color: #1e293b; font-size: 16px;">${prj.projectName}</div>
                                <div style="margin-top: 6px;">
                                  <a href="${typeof window !== 'undefined' ? window.location.origin : ''}${getBasePath()}/v?id=${prj.projectId}" 
                                     style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600;">
                                    Consulter le tableau de bord public →
                                  </a>
                                </div>
                              </td>
                            </tr>
                          `).join('')}
                        </table>
                      </div>
                    ` : ''}
                  </div>
                  
                  <!-- Footer -->
                  <div class="footer">
                    <p>Ce rapport est envoyé automatiquement via votre plateforme de gestion de projets.</p>
                    <p>&copy; ${now.getFullYear()} Gestion de Projet Digital. Tous droits réservés.</p>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
  }
}
