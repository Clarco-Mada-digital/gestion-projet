import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// Interface pour les paramètres EmailJS
export interface EmailJsSettings {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

export function EmailSettings() {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState<EmailJsSettings>({
    serviceId: '',
    templateId: 'template_default', // ID de modèle par défaut
    userId: '',
    accessToken: '',
    fromName: 'Gestion de Projet',
    fromEmail: '',
    isEnabled: true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ 
    type: 'success' | 'error' | 'info' | null; 
    message: string 
  }>({ 
    type: null, 
    message: '' 
  });

  // Charger les paramètres existants
  useEffect(() => {
    if (state.emailSettings) {
      // Convertir les anciens paramètres SMTP vers le nouveau format si nécessaire
      if ('smtpHost' in state.emailSettings) {
        // Migration depuis l'ancien format
        const oldSettings = state.emailSettings as any;
        setFormData({
          serviceId: '',
          templateId: 'template_default',
          userId: '',
          accessToken: '',
          fromName: oldSettings.fromName || 'Gestion de Projet',
          fromEmail: oldSettings.fromEmail || oldSettings.smtpUser || '',
          isEnabled: true
        });
      } else {
        // S'assurer que tous les champs requis sont présents
        const settings = state.emailSettings as Partial<EmailJsSettings>;
        setFormData({
          serviceId: settings.serviceId || '',
          templateId: settings.templateId || 'template_default',
          userId: settings.userId || '',
          accessToken: settings.accessToken || '',
          fromEmail: settings.fromEmail || '',
          fromName: settings.fromName || 'Gestion de Projet',
          isEnabled: settings.isEnabled !== false // true par défaut
        });
      }
    }
  }, [state.emailSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      // Valider les champs requis
      if (!formData.serviceId || !formData.userId || !formData.accessToken) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Mettre à jour les paramètres dans le state global
      dispatch({ 
        type: 'UPDATE_EMAIL_SETTINGS', 
        payload: formData 
      });
      
      setSaveStatus({ 
        type: 'success', 
        message: 'Paramètres email enregistrés avec succès !' 
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres email:', error);
      setSaveStatus({ 
        type: 'error', 
        message: 'Erreur lors de la sauvegarde des paramètres email' 
      });
    } finally {
      setIsSaving(false);
      
      // Effacer le message après 5 secondes
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 5000);
    }
  };

  // Fonction pour tester la connexion à EmailJS
  const testConnection = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!formData.serviceId || !formData.userId || !formData.accessToken) {
      setSaveStatus({
        type: 'error',
        message: 'Veuillez configurer les paramètres EmailJS avant de tester la connexion.'
      });
      return;
    }

    setSaveStatus({
      type: 'info',
      message: 'Test de connexion en cours...'
    });

    try {
      // Tester la connexion en envoyant un email de test
      const testEmail = {
        to: formData.fromEmail || 'test@example.com',
        subject: 'Test de connexion EmailJS',
        html: '<p>Ceci est un email de test pour vérifier la configuration EmailJS.</p>',
        fromName: formData.fromName,
        from: formData.fromEmail
      };

      // Utiliser le service email mis à jour
      const { EmailService } = await import('../../services/emailService');
      const result = await EmailService.sendEmail(testEmail, formData);

      if (result.success) {
        setSaveStatus({
          type: 'success',
          message: 'Connexion réussie ! Email de test envoyé avec succès.'
        });
      } else {
        throw new Error(result.message || 'Échec de l\'envoi de l\'email de test');
      }
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      setSaveStatus({
        type: 'error',
        message: `Erreur lors du test de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configuration EmailJS</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configurez les paramètres pour envoyer des emails via EmailJS. 
            <a 
              href="https://www.emailjs.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              En savoir plus sur EmailJS
            </a>
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Statut de sauvegarde */}
            {saveStatus.message && (
              <div 
                className={`p-4 rounded-md ${saveStatus.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200' 
                  : saveStatus.type === 'error' 
                    ? 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200' 
                    : 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                }`}
              >
                <p className="text-sm">{saveStatus.message}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Service ID */}
              <div className="col-span-2">
                <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID du service EmailJS <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="serviceId"
                  id="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="service_xxxxxxxxx"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Trouvez cet ID dans votre tableau de bord EmailJS sous "Email Services"
                </p>
              </div>

              {/* Template ID */}
              <div>
                <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID du modèle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="templateId"
                  id="templateId"
                  value={formData.templateId}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="template_xxxxxxxxx"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Créez un modèle dans EmailJS et entrez son ID ici
                </p>
              </div>

              {/* User ID */}
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User ID (Public Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="userId"
                  id="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="user_xxxxxxxxx"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Trouvez cette clé dans l'onglet "API Keys" de votre compte EmailJS
                </p>
              </div>

              {/* Access Token */}
              <div className="col-span-2">
                <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Access Token (Private Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="accessToken"
                  id="accessToken"
                  value={formData.accessToken}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="********"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ne partagez jamais cette clé. Vous la trouverez dans l'onglet "API Keys"
                </p>
              </div>

              {/* Expéditeur */}
              <div>
                <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom de l'expéditeur
                </label>
                <input
                  type="text"
                  name="fromName"
                  id="fromName"
                  value={formData.fromName}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Votre entreprise"
                />
              </div>

              <div>
                <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email de l'expéditeur <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="fromEmail"
                  id="fromEmail"
                  value={formData.fromEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="contact@votredomaine.com"
                  required
                />
              </div>

              {/* Activer/désactiver */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isEnabled"
                    name="isEnabled"
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isEnabled" className="font-medium text-gray-700 dark:text-gray-300">
                    Activer l'envoi d'emails
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    Activez ou désactivez l'envoi d'emails dans l'application
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={testConnection}
                disabled={isSaving || !formData.serviceId || !formData.userId || !formData.accessToken}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tester la connexion
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Guide de configuration</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="prose dark:prose-invert max-w-none">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Créez un compte sur <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">EmailJS</a> si ce n'est pas déjà fait</li>
              <li>Ajoutez un service d'email (Gmail, Outlook, etc.) dans l'onglet "Email Services"</li>
              <li>Créez un modèle d'email dans l'onglet "Email Templates"</li>
              <li>Récupérez vos clés d'API dans l'onglet "API Keys"</li>
              <li>Entrez ces informations dans le formulaire ci-dessus</li>
              <li>Testez la connexion pour vérifier que tout fonctionne</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;
