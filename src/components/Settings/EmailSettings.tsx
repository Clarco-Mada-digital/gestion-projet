import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EmailService } from '../../services/emailService';

// Interface pour les paramètres d'email
export interface EmailJsSettings {
  provider: 'emailjs' | 'google';
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken?: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
  defaultSubject: string;
}

export function EmailSettings() {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState<EmailJsSettings>({
    provider: 'emailjs',
    serviceId: '',
    templateId: 'template_default',
    userId: '',
    accessToken: '',
    fromName: 'Gestion de Projet',
    fromEmail: '',
    isEnabled: true,
    defaultSubject: 'Delivery du %dd au %df'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string
  }>({
    type: null,
    message: ''
  });

  // Charger les paramètres depuis le state global
  useEffect(() => {
    if (state.emailSettings) {
      setFormData({
        provider: state.emailSettings.provider || 'emailjs',
        serviceId: state.emailSettings.serviceId || '',
        templateId: state.emailSettings.templateId || 'template_default',
        userId: state.emailSettings.userId || '',
        accessToken: state.emailSettings.accessToken || '',
        fromEmail: state.emailSettings.fromEmail || '',
        fromName: state.emailSettings.fromName || 'Gestion de Projet',
        isEnabled: state.emailSettings.isEnabled !== false,
        defaultSubject: state.emailSettings.defaultSubject || 'Delivery du %dd au %df'
      });
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
      // Valider les champs requis uniquement pour EmailJS
      if (formData.provider === 'emailjs' && (!formData.serviceId || !formData.userId)) {
        const missingFields = [];
        if (!formData.serviceId) missingFields.push('Service ID');
        if (!formData.userId) missingFields.push('User ID');

        throw new Error(`Veuillez remplir les champs obligatoires : ${missingFields.join(', ')}`);
      }

      const settingsToSave = {
        provider: formData.provider,
        serviceId: formData.serviceId.trim(),
        templateId: formData.templateId.trim(),
        userId: formData.userId.trim(),
        accessToken: formData.accessToken?.trim() || '',
        fromName: formData.fromName.trim(),
        fromEmail: formData.fromEmail.trim(),
        isEnabled: formData.isEnabled,
        defaultSubject: formData.defaultSubject || 'Delivery du %dd au %df'
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

    // Validation selon le provider
    if (formData.provider === 'emailjs' && (!formData.serviceId || !formData.userId || !formData.fromEmail)) {
      const missingFields = [];
      if (!formData.serviceId) missingFields.push('Service ID');
      if (!formData.userId) missingFields.push('User ID (clé publique)');
      if (!formData.fromEmail) missingFields.push('Email d\'expéditeur');

      const errorMessage = `Veuillez configurer les champs obligatoires avant de tester : ${missingFields.join(', ')}`;
      setSaveStatus({ type: 'error', message: errorMessage });
      return;
    }

    if (formData.provider === 'google' && (!state.googleAccessToken || !state.calendarEmail)) {
      setSaveStatus({
        type: 'error',
        message: 'Vous devez être connecté avec Google (via le Calendrier ou en haut à droite) pour tester l\'envoi Gmail.'
      });
      return;
    }

    setIsTesting(true);

    setSaveStatus({
      type: 'info',
      message: 'Préparation du test de connexion...'
    });

    try {
      // Tester la connexion en envoyant un email de test
      const isGoogle = formData.provider === 'google';
      const testEmail: any = {
        to: isGoogle ? (state.calendarEmail || formData.fromEmail) : formData.fromEmail,
        subject: `Test de connexion ${isGoogle ? 'Gmail' : 'EmailJS'}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, ${isGoogle ? '#4285F4, #34A853' : '#2563eb, #3b82f6'}); padding: 32px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Test de connexion réussi !</h1>
            </div>
            <div style="padding: 32px; background: white;">
              <p style="font-size: 16px; margin-top: 0;">Félicitations, votre configuration <strong>${isGoogle ? 'Google Gmail' : 'EmailJS'}</strong> fonctionne parfaitement.</p>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; font-family: monospace; font-size: 13px; border: 1px dashed #cbd5e1;">
                <p style="margin: 4px 0;"><strong>Fournisseur:</strong> ${isGoogle ? 'Google Direct (Gmail)' : 'EmailJS'}</p>
                ${!isGoogle ? `
                <p style="margin: 4px 0;"><strong>Service ID:</strong> ${formData.serviceId}</p>
                <p style="margin: 4px 0;"><strong>Template ID:</strong> ${formData.templateId}</p>
                <p style="margin: 4px 0;"><strong>User ID:</strong> ${formData.userId.substring(0, 8)}...</p>
                ` : `
                <p style="margin: 4px 0;"><strong>Compte Google:</strong> ${state.calendarEmail}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> Authentifié et autorisé</p>
                `}
                <p style="margin: 4px 0;"><strong>Expéditeur:</strong> ${formData.fromName}</p>
              </div>
              
              <p style="font-size: 14px; color: #64748b;">
                ${isGoogle 
                  ? "Vous pouvez maintenant envoyer des rapports directement via votre propre compte Google. Vos clients pourront vous répondre directement !" 
                  : "Votre service EmailJS est prêt à être utilisé pour l'envoi de rapports."}
              </p>
            </div>
            <div style="padding: 20px; background: #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              Envoyé par votre outil de Gestion de Projet Digital
            </div>
          </div>
        `,
        fromName: formData.fromName,
        from: isGoogle ? state.calendarEmail : formData.fromEmail,
        provider: formData.provider,
        googleAccessToken: isGoogle ? state.googleAccessToken : undefined,
        templateParams: !isGoogle ? {
          to_name: 'Utilisateur de test',
          from_name: formData.fromName || 'Gestion de Projet',
          subject: 'Test de connexion EmailJS',
          message: 'Ceci est un email de test pour vérifier la configuration EmailJS.'
        } : undefined
      };

      setSaveStatus({ type: 'info', message: `Envoi de l'email via ${isGoogle ? 'Gmail' : 'EmailJS'}...` });

      // Envoyer l'email de test
      const result = await EmailService.sendEmail(testEmail, formData.provider === 'emailjs' ? {
        serviceId: formData.serviceId.trim(),
        templateId: formData.templateId.trim(),
        userId: formData.userId.trim(),
        accessToken: formData.accessToken?.trim(),
        fromName: formData.fromName.trim(),
        fromEmail: formData.fromEmail.trim()
      } : undefined);

      if (result.success) {
        const successMessage = 'Connexion réussie ! Un email de test a été envoyé avec succès.';

        // Préparer les données à sauvegarder
        const settingsToSave = {
          provider: formData.provider,
          serviceId: formData.serviceId.trim(),
          templateId: formData.templateId.trim(),
          userId: formData.userId.trim(),
          accessToken: formData.accessToken?.trim() || '',
          fromName: formData.fromName.trim(),
          fromEmail: formData.fromEmail.trim(),
          isEnabled: formData.isEnabled,
          defaultSubject: formData.defaultSubject || 'Delivery du %dd au %df'
        };



        // Mettre à jour le statut du test
        setSaveStatus({
          type: 'success',
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

            {/* Choix du fournisseur */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 uppercase tracking-wider text-center">
                Fournisseur de service Email
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, provider: 'google' }))}
                  className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${formData.provider === 'google'
                    ? 'border-blue-500 bg-white dark:bg-gray-700 shadow-lg scale-105'
                    : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-500 opacity-60 hover:opacity-100'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">📧</div>
                    <div className="font-bold text-gray-900 dark:text-white">Google Gmail API</div>
                    <div className="text-xs text-gray-500">Utilise votre email de connexion</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, provider: 'emailjs' }))}
                  className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${formData.provider === 'emailjs'
                    ? 'border-blue-500 bg-white dark:bg-gray-700 shadow-lg scale-105'
                    : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-500 opacity-60 hover:opacity-100'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="font-bold text-gray-900 dark:text-white">EmailJS Service</div>
                    <div className="text-xs text-gray-500">Configuration manuelle (Service externe)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Statut de sauvegarde */}
            {saveStatus.message && (
              <div
                className={`p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 border ${saveStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
                  : saveStatus.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                  }`}
              >
                <div className="flex items-center">
                  {saveStatus.type === 'success' && <span className="mr-2">✅</span>}
                  {saveStatus.type === 'error' && <span className="mr-2">⚠️</span>}
                  {saveStatus.type === 'info' && <span className="mr-2 text-blue-500">ℹ️</span>}
                  <p className="text-sm font-medium">{saveStatus.message}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {formData.provider === 'google' ? (
                /* Configuration Google */
                <div className="col-span-2 space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl">
                        G
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Connexion Google</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          L'envoi se fera via votre compte Google (Gmail).
                        </p>
                      </div>
                    </div>

                    {state.googleAccessToken ? (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-3"></div>
                          <div>
                            <p className="text-sm font-bold text-green-800 dark:text-green-200">Connecté avec succès</p>
                            <p className="text-xs text-green-600 dark:text-green-400">{state.calendarEmail}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold uppercase">Actif</span>
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
                          Vous n'êtes pas encore authentifié avec les permissions Gmail.
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                          L'authentification Google est partagée avec le Calendrier.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            dispatch({ type: 'SET_VIEW', payload: 'calendar' });
                          }}
                          className="w-full sm:w-auto px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all"
                        >
                          Aller au Calendrier pour se connecter
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nom de l'expéditeur
                          </label>
                          <input
                            type="text"
                            name="fromName"
                            value={formData.fromName}
                            onChange={handleChange}
                            className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            placeholder="Ex: Jean Dupont"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Utiliser cet email (Info)
                          </label>
                          <input
                            type="email"
                            readOnly
                            value={state.calendarEmail || 'Non connecté'}
                            className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-900 bg-gray-50 text-gray-500 cursor-not-allowed shadow-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <h5 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center">
                      <span className="mr-2">💡</span> Pourquoi utiliser Google Gmail ?
                    </h5>
                    <ul className="text-xs text-indigo-700 dark:text-indigo-400 space-y-2 list-disc pl-5">
                      <li><strong>Réponses directes :</strong> Vos clients peuvent répondre directement à vos emails de rapport.</li>
                      <li><strong>Format HTML riche :</strong> Support complet des styles, couleurs et mises en page professionnelles.</li>
                      <li><strong>Pas de configuration complexe :</strong> Pas d'IDs de service ou de modèles à créer manuellement.</li>
                      <li><strong>Une seule connexion :</strong> Utilisez le compte avec lequel vous collaborez déjà.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* Configuration EmailJS */
                <>
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
              <div className="col-span-2">
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
              <div className="col-span-2">
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
              <div className="col-span-2">
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

              <div className="col-span-2">
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

              {/* Sujet par défaut */}
              <div className="col-span-2">
                <label htmlFor="defaultSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Objet par défaut des rapports
                </label>
                <input
                  type="text"
                  name="defaultSubject"
                  id="defaultSubject"
                  value={formData.defaultSubject}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Delivery du %dd au %df"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Utilisez <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded">%dd</span> pour la date de début et <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded">%df</span> pour la date de fin.
                </p>
              </div>

              {/* Activer/désactiver */}
              <div className="flex items-start col-span-2 mt-4 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center h-5">
                  <input
                    id="isEnabled"
                    name="isEnabled"
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300 rounded-lg transition-all"
                  />
                </div>
                <div className="ml-4 text-sm">
                  <label htmlFor="isEnabled" className="font-bold text-gray-700 dark:text-gray-300">
                    Activer l'envoi d'emails
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    Activez ou désactivez globalement l'envoi d'emails dans l'application
                  </p>
                </div>
              </div>
          </>
        )}
      </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
              <button
                type="button"
                onClick={testConnection}
                disabled={isSaving || isTesting || (formData.provider === 'emailjs' && (!formData.serviceId || !formData.userId || !formData.fromEmail))}
                className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isTesting
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
                disabled={isSaving || isTesting || (formData.provider === 'emailjs' && (!formData.serviceId || !formData.userId))}
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
