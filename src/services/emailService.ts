export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string; // Version texte de l'email
  from?: string;
  fromName?: string;
}

export class EmailService {
  static async sendEmail(options: EmailOptions, emailSettings: any): Promise<{ success: boolean; message: string }> {
    try {
      const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName, useTLS } = emailSettings;
      
      // Vérifier que les paramètres SMTP sont configurés
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
        console.error('Paramètres SMTP manquants');
        return { success: false, message: 'Paramètres SMTP non configurés' };
      }

      // Créer le contenu de l'email
      const emailData = {
        from: options.from || `${fromName || 'Gestion de Projet'} <${fromEmail || smtpUser}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html
      };

      // Envoyer l'email via l'API EmailJS (à configurer côté serveur)
      // Remarque : Dans une application réelle, vous devriez envoyer cette requête à votre backend
      // pour éviter d'exposer vos identifiants SMTP dans le code frontend
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailData,
          smtpConfig: {
            host: smtpHost,
            port: smtpPort,
            secure: useTLS, // true for 465, false for other ports
            auth: {
              user: smtpUser,
              pass: smtpPassword,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi de l\'email');
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
