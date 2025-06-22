import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, TeamMember, Team } from '../../types';
import { Card } from '../UI/Card';
import { TeamManagement } from '../Settings/TeamManagement';

export function SettingsView() {
  console.log('Rendering SettingsView component');
  const { state, dispatch } = useApp();
  console.log('SettingsView - current state:', state);
  
  const [activeTab, setActiveTab] = useState('teams'); // Par défaut sur l'onglet des équipes
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Effet pour suivre le cycle de vie du composant
  useEffect(() => {
    console.log('=== SETTINGS VIEW MOUNTED ===');
    console.log('Current user:', state.currentUser);
    console.log('Current view:', state.currentView);
    
    return () => {
      console.log('=== SETTINGS VIEW UNMOUNTED ===');
    };
  }, []);

  // Vérifier si l'utilisateur est chargé
  if (!state.currentUser) {
    console.log('En attente du chargement des données utilisateur...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des paramètres utilisateur...</p>
        </div>
      </div>
    );
  }

  // Initialiser le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (state.currentUser) {
      setFormData({
        name: state.currentUser.name,
        email: state.currentUser.email,
        phone: state.currentUser.phone,
        position: state.currentUser.position,
        department: state.currentUser.department,
        language: state.currentUser.language,
        timezone: state.currentUser.timezone,
        emailNotifications: state.currentUser.emailNotifications,
        pushNotifications: state.currentUser.pushNotifications,
      });
    }
  }, [state.currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'utilisateur dans le contexte
      dispatch({ type: 'UPDATE_USER', payload: formData });
      
      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);
      
      // Cacher le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour du profil');
      console.error('Erreur lors de la mise à jour du profil:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegenerateApiKey = async () => {
    if (!state.currentUser || !window.confirm('Êtes-vous sûr de vouloir régénérer votre clé API ? Cette action est irréversible.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newApiKey = `sk_${Math.random().toString(36).substr(2, 32)}`;
      dispatch({ 
        type: 'UPDATE_USER', 
        payload: { apiKey: newApiKey } 
      });
      
      setSuccess('Clé API régénérée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Impossible de régénérer la clé API');
      console.error('Erreur lors de la régénération de la clé API:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copié dans le presse-papier');
      setTimeout(() => setSuccess(null), 2000);
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
      setError('Impossible de copier dans le presse-papier');
    });
  };

  // Bouton de débogage temporaire - À supprimer une fois le problème résolu
  const debugForceSettings = () => {
    console.log('=== FORCAGE DE LA VUE SETTINGS ===');
    window.localStorage.setItem('debug_force_settings', 'true');
    window.location.reload();
  };

  const tabs = [
    { name: 'Équipes', id: 'teams' },
    { name: 'Profil', id: 'profile' },
    { name: 'Compte', id: 'account' },
    { name: 'Notifications', id: 'notifications' },
    { name: 'Facturation', id: 'billing' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teams':
        return (
          <div className="space-y-6">
            <TeamManagement />
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Profil Utilisateur</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Modifier le profil
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Réinitialiser le formulaire avec les données actuelles
                      if (state.currentUser) {
                        setFormData({
                          name: state.currentUser.name,
                          email: state.currentUser.email,
                          phone: state.currentUser.phone,
                          position: state.currentUser.position,
                          department: state.currentUser.department,
                          language: state.currentUser.language,
                          timezone: state.currentUser.timezone,
                          emailNotifications: state.currentUser.emailNotifications,
                          pushNotifications: state.currentUser.pushNotifications,
                        });
                      }
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    form="profile-form"
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </div>
            
            <form id="profile-form" onSubmit={handleUserUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom complet *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    required
                    disabled={!isEditing || isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    required
                    disabled={!isEditing || isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    disabled={!isEditing || isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Poste</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    disabled={!isEditing || isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Département</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    disabled={!isEditing || isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Langue</label>
                  <select
                    name="language"
                    value={formData.language || 'fr'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    disabled={!isEditing || isLoading}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Fuseau horaire</label>
                  <select
                    name="timezone"
                    value={formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    disabled={!isEditing || isLoading}
                  >
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New York (EST)</option>
              
              <div className="flex items-center">
                <div className="flex items-center h-5">
                  <input
                    id="email-notifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={!!formData.emailNotifications}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700"
                    disabled={!isEditing || isLoading}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="email-notifications" className="font-medium">Notifications par email</label>
                  <p className="text-gray-500 dark:text-gray-400">Recevoir des notifications par email</p>
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-notifications" className="font-medium">Notifications push</label>
                    <p className="text-gray-500 dark:text-gray-400">Recevoir des notifications sur ce navigateur</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'equipe' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Équipe</h2>
            <p className="text-gray-500">Gérez les membres de votre équipe et leurs autorisations.</p>
            {/* À implémenter : Liste des membres de l'équipe */}
          </div>
        )}

        {activeTab === 'api' && state.currentUser && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Clé API</h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Votre clé API :</p>
              <div className="flex items-center space-x-2">
                <code className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono overflow-x-auto max-w-md">
                  {state.currentUser.apiKey || '••••••••••••••••••••••••••••••••'}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(state.currentUser?.apiKey || '')}
                  className="px-3 py-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  disabled={!state.currentUser?.apiKey}
                >
                  Copier
                </button>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRegenerateApiKey}
                  className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Traitement...' : 'Régénérer la clé API'}
                </button>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  La régénération de votre clé API invalidera immédiatement l'ancienne clé.
                </p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Ne partagez jamais votre clé API avec des tiers non autorisés. Cette clé donne accès à vos données personnelles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
