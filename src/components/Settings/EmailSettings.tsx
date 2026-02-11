import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// Interface pour les paramètres EmailJS
export interface EmailJsSettings {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken?: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

export function EmailSettings() {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState<EmailJsSettings>({
    serviceId: '',
    templateId: 'template_default',
    userId: '',
    accessToken: '',
    fromName: 'Gestion de Projet',
    fromEmail: '',
    isEnabled: true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    isRunning: boolean;
    isSuccess: boolean | null;
    message: string;
  }>({
    isRunning: false,
    isSuccess: null,
    message: ''
  });
  const [saveStatus, setSaveStatus] = useState<{ 
    type: 'success' | 'error' | 'info' | null; 
    message: string 
  }>({ 
    type: null, 
    message: '' 
  });

  // Charger les paramètres email au chargement du composant
  useEffect(() => {
    
    
    try {
      // Charger directement depuis le localStorage
      const savedData = localStorage.getItem('astroProjectManagerData');
      
      if (savedData) {
        const data = JSON.parse(savedData);
        
        
        // Vérifier si on a des paramètres email
        if (data.emailSettings) {
          
          
          // Mettre à jour le formulaire avec les données du localStorage
          const settings = data.emailSettings;
          const formSettings = {
            serviceId: settings.serviceId || '',
            templateId: settings.templateId || 'template_default',
            userId: settings.userId || '',
            accessToken: settings.accessToken || '',
            fromEmail: settings.fromEmail || '',
            fromName: settings.fromName || 'Gestion de Projet',
            isEnabled: settings.isEnabled !== false
          };
          
          
          setFormData(formSettings);
          
          // Mettre à jour le state global si nécessaire
          if (JSON.stringify(state.emailSettings) !== JSON.stringify(formSettings)) {
            dispatch({
              type: 'UPDATE_EMAIL_SETTINGS',
              payload: formSettings
            });
          }
          return;
        }
      }
      
      // Si on arrive ici, c'est qu'il n'y a pas de paramètres sauvegardés
      
      const defaultSettings = {
        serviceId: '',
        templateId: 'template_default',
        userId: '',
        accessToken: '',
        fromEmail: '',
        fromName: 'Gestion de Projet',
        isEnabled: true
      };
      setFormData(defaultSettings);
      
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  }, []); // Exécuté une seule fois au chargement

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
      if (!formData.serviceId || !formData.userId) {
        const missingFields = [];
        if (!formData.serviceId) missingFields.push('Service ID');
        if (!formData.userId) missingFields.push('User ID');
        
        throw new Error(`Veuillez remplir les champs obligatoires : ${missingFields.join(', ')}`);
      }

      // Préparer les données à envoyer
      const settingsToSave = {
        serviceId: formData.serviceId.trim(),
        templateId: formData.templateId.trim(),
        userId: formData.userId.trim(),
        accessToken: formData.accessToken?.trim() || '',
        fromName: formData.fromName.trim(),
        fromEmail: formData.fromEmail.trim(),
        isEnabled: formData.isEnabled
      };
      
      
      
      // Mettre à jour les paramètres dans le state global
      dispatch({ 
        type: 'UPDATE_EMAIL_SETTINGS', 
        payload: settingsToSave 
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
    
    if (isTesting) return; // Ne pas relancer un test si un test est déjà en cours
    
    // Réinitialiser les états précédents
    setSaveStatus({ type: null, message: '' });
    
    // Validation des champs obligatoires
    if (!formData.serviceId || !formData.userId || !formData.fromEmail) {
      const missingFields = [];
      if (!formData.serviceId) missingFields.push('Service ID');
      if (!formData.userId) missingFields.push('User ID (clé publique)');
      if (!formData.fromEmail) missingFields.push('Email d\'expéditeur');
      
      const errorMessage = `Veuillez configurer les champs obligatoires avant de tester : ${missingFields.join(', ')}`;
      
      setSaveStatus({
        type: 'error',
        message: errorMessage
      });
      return;
    }

    setIsTesting(true);
    setTestStatus({
      isRunning: true,
      isSuccess: null,
      message: 'Initialisation du test...'
    });
    
    setSaveStatus({
      type: 'info',
      message: 'Préparation du test de connexion...'
    });

    try {
      // Tester la connexion en envoyant un email de test
      const testEmail = {
        to: formData.fromEmail, // Envoyer à soi-même pour le test
        subject: 'Test de connexion EmailJS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <h2 style="color: #1a365d;">Test de connexion EmailJS réussi !</h2>
            <p>Félicitations, votre configuration EmailJS fonctionne correctement.</p>
            <div style="background: #f8fafc; border-left: 4px solid #4299e1; padding: 12px; margin: 16px 0; font-family: monospace; font-size: 14px;">
              <p><strong>Service ID:</strong> ${formData.serviceId}</p>
              <p><strong>Template ID:</strong> ${formData.templateId}</p>
              <p><strong>User ID:</strong> ${formData.userId.substring(0, 8)}...</p>
              <p><strong>Expéditeur:</strong> ${formData.fromName} &lt;${formData.fromEmail}&gt;</p>
            </div>
            <p>Vous pouvez maintenant utiliser le service d'envoi d'emails dans votre application.</p>
          </div>
        `,
        fromName: formData.fromName,
        from: formData.fromEmail,
        templateParams: {
          to_name: 'Utilisateur de test',
          from_name: formData.fromName || 'Gestion de Projet',
          subject: 'Test de connexion EmailJS',
          message: 'Ceci est un email de test pour vérifier la configuration EmailJS.'
        }
      };

      setTestStatus(prev => ({ ...prev, message: 'Chargement du service EmailJS...' }));
      
      // Importer dynamiquement le service email
      const { EmailService } = await import('../../services/emailService');
      
      setTestStatus(prev => ({ ...prev, message: 'Envoi de l\'email de test...' }));
      
      // Envoyer l'email de test
      const result = await EmailService.sendEmail(testEmail, {
        serviceId: formData.serviceId.trim(),
        templateId: formData.templateId.trim(),
        userId: formData.userId.trim(),
        accessToken: formData.accessToken?.trim(),
        fromName: formData.fromName.trim(),
        fromEmail: formData.fromEmail.trim()
      });

      if (result.success) {
        const successMessage = 'Connexion réussie ! Un email de test a été envoyé avec succès.';
        
        // Préparer les données à sauvegarder
        const settingsToSave = {
          serviceId: formData.serviceId.trim(),
          templateId: formData.templateId.trim(),
          userId: formData.userId.trim(),
          accessToken: formData.accessToken?.trim() || '',
          fromName: formData.fromName.trim(),
          fromEmail: formData.fromEmail.trim(),
          isEnabled: formData.isEnabled
        };
        
        
        
        // Mettre à jour le statut du test
        setTestStatus({
          isRunning: false,
          isSuccess: true,
          message: successMessage
        });
        
        // Afficher le message de succès
        setSaveStatus({
          type: 'success',
          message: successMessage
        });
        
        // Mettre à jour les paramètres dans le state global
        dispatch({ 
          type: 'UPDATE_EMAIL_SETTINGS', 
          payload: settingsToSave 
        });
        
        // Mettre à jour le formulaire local avec les données nettoyées
        setFormData(settingsToSave);
      } else {
        throw new Error(result.message || 'Échec de l\'envoi de l\'email de test');
      }
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      
      let errorMessage = 'Erreur inconnue lors du test de connexion';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Messages d'erreur plus conviviaux
        if (errorMessage.includes('public key') || errorMessage.includes('User ID')) {
          errorMessage = 'Clé publique (User ID) invalide. Vérifiez votre configuration EmailJS.';
        } else if (errorMessage.includes('template') || errorMessage.includes('service')) {
          errorMessage = 'Service ou modèle introuvable. Vérifiez vos IDs de service et de modèle.';
        } else if (errorMessage.includes('400')) {
          errorMessage = 'Requête invalide. Vérifiez vos identifiants EmailJS.';
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = 'Erreur d\'authentification. Vérifiez votre User ID et votre clé privée.';
        } else if (errorMessage.includes('404')) {
          errorMessage = 'Service ou modèle introuvable. Vérifiez vos IDs.';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
        }
      }
      
      setTestStatus({
        isRunning: false,
        isSuccess: false,
        message: errorMessage
      });
      
      setSaveStatus({
        type: 'error',
        message: `Échec du test de connexion : ${errorMessage}`
      });
    } finally {
      setIsTesting(false);
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
                  Clé publique (User ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="userId"
                  id="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                  placeholder="Votre clé publique EmailJS"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Trouvez cette clé dans l'onglet "API Keys" de votre compte EmailJS. 
                  <a 
                    href="https://dashboard.emailjs.com/admin/account" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Accéder aux clés API
                  </a>
                </p>
              </div>

              {/* Access Token */}
              <div className="col-span-2">
                <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token d'accès (Optionnel)
                </label>
                <div className="relative">
                  <input
                    type={showAccessToken ? 'text' : 'password'}
                    name="accessToken"
                    id="accessToken"
                    value={formData.accessToken}
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                    placeholder="Votre token d'accès sécurisé"
                    disabled={isSaving || isTesting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isSaving || isTesting}
                  >
                    {showAccessToken ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optionnel - Nécessaire uniquement pour les requêtes côté serveur
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

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
              <button
                type="button"
                onClick={testConnection}
                disabled={isSaving || isTesting || !formData.serviceId || !formData.userId || !formData.fromEmail}
                className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isTesting 
                    ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' 
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isTesting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Test en cours...
                  </>
                ) : (
                  'Tester la connexion'
                )}
              </button>
              <button
                type="submit"
                disabled={isSaving || isTesting || !formData.serviceId || !formData.userId}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les paramètres'
                )}
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
