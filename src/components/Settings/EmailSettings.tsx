import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { EmailSettings as EmailSettingsType } from '../../types';

export function EmailSettings() {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState<EmailSettingsType>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    useSSL: false,
    useTLS: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ 
    type: null, 
    message: '' 
  });

  // Charger les paramètres existants
  useEffect(() => {
    if (state.emailSettings) {
      setFormData(state.emailSettings);
    }
  }, [state.emailSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, type } = target;
    const value = type === 'checkbox' ? target.checked : target.value;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'smtpPort' ? parseInt(value as string, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      dispatch({ type: 'UPDATE_EMAIL_SETTINGS', payload: formData });
      
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

  const testConnection = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formData.smtpHost || !formData.smtpPort || !formData.smtpUser || !formData.smtpPassword) {
      alert('Veuillez remplir tous les champs requis pour tester la connexion');
      return;
    }
    
    setSaveStatus({ type: null, message: 'Test de connexion en cours...' });
    
    try {
      // Simuler un test de connexion (à remplacer par un appel API réel)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSaveStatus({ 
        type: 'success', 
        message: 'Connexion au serveur SMTP réussie !' 
      });
    } catch (error) {
      console.error('Erreur de connexion SMTP:', error);
      setSaveStatus({ 
        type: 'error', 
        message: 'Échec de la connexion au serveur SMTP. Vérifiez vos paramètres.' 
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Paramètres Email</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configurez les paramètres SMTP pour l'envoi d'emails depuis l'application
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {saveStatus.message && (
            <div className={`mb-6 p-4 rounded-md ${
              saveStatus.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                : saveStatus.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
            }`}>
              <p className={`text-sm flex items-center ${
                saveStatus.type === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : saveStatus.type === 'error'
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-blue-800 dark:text-blue-200'
              }`}>
                {saveStatus.type === 'success' && (
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {saveStatus.type === 'error' && (
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {saveStatus.type === null && (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saveStatus.message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Serveur SMTP <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2.94 6.412A2 2 0 002 8.108V16a2 2 0 002 2h12a2 2 0 002-2V8.108a2 2 0 00-.627-1.453L12.03.817a2 2 0 00-2.55-.116L2.94 6.412zM10 12a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="smtpHost"
                      name="smtpHost"
                      value={formData.smtpHost}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="smtp.example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Port SMTP <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      id="smtpPort"
                      name="smtpPort"
                      value={formData.smtpPort}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="587"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom d'utilisateur SMTP <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="smtpUser"
                      name="smtpUser"
                      value={formData.smtpUser}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="nom@exemple.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mot de passe SMTP <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      id="smtpPassword"
                      name="smtpPassword"
                      value={formData.smtpPassword}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email de l'expéditeur <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="fromEmail"
                      name="fromEmail"
                      value={formData.fromEmail}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="contact@votredomaine.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom de l'expéditeur
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="fromName"
                      name="fromName"
                      value={formData.fromName}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="Votre Société"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="useSSL"
                      name="useSSL"
                      type="checkbox"
                      checked={formData.useSSL}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="useSSL" className="font-medium text-gray-700 dark:text-gray-300">
                      Utiliser SSL
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Activez cette option si votre serveur nécessite une connexion SSL
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="useTLS"
                      name="useTLS"
                      type="checkbox"
                      checked={formData.useTLS}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="useTLS" className="font-medium text-gray-700 dark:text-gray-300">
                      Utiliser TLS
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Activez cette option si votre serveur nécessite une connexion TLS
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Tester la connexion
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                    <>
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Enregistrer les paramètres
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
