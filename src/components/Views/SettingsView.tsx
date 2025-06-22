import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, TeamMember, DayOfWeek, getDayName, DAYS_OF_WEEK } from '../../types';
import { Card } from '../UI/Card';
import { TeamManagement } from '../Settings/TeamManagement';
import { TeamModal } from '../Modals/TeamModal';
import { EmailSettings } from '../Settings/EmailSettings';
import { AISettings } from '../Settings/AISettings';

export function SettingsView() {
  console.log('Rendering SettingsView component');
  const { state, dispatch } = useApp();
  console.log('SettingsView - current state:', state);
  
  // États pour la gestion des onglets et des modales
  const [activeTab, setActiveTab] = useState('profile');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  
  // Liste des onglets disponibles
  const tabs = [
    { id: 'profile', name: 'Profil' },
    { id: 'team', name: 'Équipe' },
    { id: 'email', name: 'Paramètres Email' },
    { id: 'ai', name: 'Intelligence Artificielle' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'appearance', name: 'Apparence' },
  ];
  
  // États pour le formulaire de profil
  const [formData, setFormData] = useState<Partial<User>>({
    settings: {
      daysOff: ['sunday'] // Valeur par défaut
    },
    daysOff: ['sunday']
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // État local pour le chargement des données utilisateur
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  
  // Effet pour suivre le cycle de vie du composant
  useEffect(() => {
    if (state.users.length > 0) {
      console.log('=== SETTINGS VIEW MOUNTED ===');
      console.log('Current user:', state.users[0]);
      console.log('Current view:', state.currentView);
      setIsUserLoaded(true);
    }
    
    return () => {
      console.log('=== SETTINGS VIEW UNMOUNTED ===');
    };
  }, [state.users, state.currentView]);
  
  // Gestion de l'ouverture/fermeture de la modale d'équipe
  const handleOpenTeamModal = (member?: TeamMember) => {
    if (member) {
      setCurrentMember(member);
    } else {
      setCurrentMember(null);
    }
    setIsTeamModalOpen(true);
  };

  const handleCloseTeamModal = () => {
    setIsTeamModalOpen(false);
    setCurrentMember(null);
  };

  // Gestion de la soumission du formulaire de membre d'équipe
  const handleTeamMemberSubmit = (memberData: Partial<User>) => {
    try {
      if (currentMember) {
        // Créer un nouvel objet avec uniquement les propriétés nécessaires
        const updatedUser: Partial<User> = {
          ...currentMember, // Conserver les propriétés existantes
          name: memberData.name || currentMember.name,
          email: memberData.email || currentMember.email,
          phone: memberData.phone || currentMember.phone,
          position: memberData.position || currentMember.position,
          department: memberData.department || currentMember.department,
          role: (memberData.role as 'admin' | 'member' | 'viewer') || currentMember.role || 'member',
          emailNotifications: memberData.emailNotifications !== undefined 
            ? memberData.emailNotifications 
            : currentMember.emailNotifications,
          pushNotifications: memberData.pushNotifications !== undefined 
            ? memberData.pushNotifications 
            : currentMember.pushNotifications,
          language: memberData.language || currentMember.language || 'fr',
          timezone: memberData.timezone || currentMember.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          updatedAt: new Date().toISOString(),
          settings: {
            ...currentMember.settings,
            language: memberData.language || currentMember.settings?.language || 'fr',
            timezone: memberData.timezone || currentMember.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            emailNotifications: memberData.emailNotifications !== undefined 
              ? memberData.emailNotifications 
              : currentMember.settings?.emailNotifications !== false
          }
        };
        
        // Ne pas inclure les propriétés undefined
        Object.keys(updatedUser).forEach(key => 
          updatedUser[key as keyof User] === undefined && delete updatedUser[key as keyof User]
        );
        
        dispatch({ 
          type: 'UPDATE_USER', 
          payload: updatedUser
        });
        
        setSuccess('Membre d\'équipe mis à jour avec succès');
      } else {
        // Ajout d'un nouveau membre
        const newUser: User = {
          // L'ID sera généré par le reducer
          name: memberData.name || '',
          email: memberData.email || '',
          phone: memberData.phone || '',
          position: memberData.position || '',
          department: memberData.department || '',
          role: (memberData.role as 'admin' | 'member' | 'viewer') || 'member',
          status: 'active',
          lastActive: new Date().toISOString(),
          avatar: '',
          emailNotifications: memberData.emailNotifications !== false,
          pushNotifications: memberData.pushNotifications !== false,
          language: memberData.language || 'fr',
          timezone: memberData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          // Les champs createdAt et updatedAt seront gérés par le reducer
          settings: {
            theme: 'light',
            language: memberData.language || 'fr',
            timezone: memberData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: true,
            emailNotifications: memberData.emailNotifications !== false
          }
        };
        
        dispatch({ 
          type: 'ADD_USER', 
          payload: newUser
        });
        
        setSuccess('Membre d\'équipe ajouté avec succès');
      }
      
      // Fermer la modale après un court délai
      setTimeout(() => {
        setIsTeamModalOpen(false);
        setCurrentMember(null);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour du membre d\'équipe');
      console.error('Erreur lors de la mise à jour du membre d\'équipe:', err);
    }
  };

  // Vérifier si les utilisateurs sont chargés
  if (state.users.length === 0) {
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
  
  // Utiliser le premier utilisateur comme utilisateur actuel
  const currentUser = state.users[0];

  // Effet pour suivre le cycle de vie du composant
  useEffect(() => {
    console.log('=== SETTINGS VIEW MOUNTED ===');
    console.log('Current user:', currentUser);
    console.log('Current view:', state.currentView);
    
    return () => {
      console.log('=== SETTINGS VIEW UNMOUNTED ===');
    };
  }, [state.users, state.currentView]);

  // Initialiser le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (state.users.length > 0) {
      const primaryUser = state.users[0];
      const defaultDaysOff = ['sunday'];
      const userDaysOff = primaryUser.daysOff || primaryUser.settings?.daysOff || defaultDaysOff;
      
      setFormData({
        name: primaryUser.name,
        email: primaryUser.email,
        phone: primaryUser.phone || '',
        position: primaryUser.position || '',
        department: primaryUser.department || '',
        language: primaryUser.language || 'fr',
        timezone: primaryUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        emailNotifications: primaryUser.emailNotifications !== false,
        pushNotifications: primaryUser.pushNotifications !== false,
        settings: {
          ...primaryUser.settings,
          daysOff: Array.isArray(userDaysOff) ? userDaysOff : defaultDaysOff
        },
        daysOff: Array.isArray(userDaysOff) ? userDaysOff : defaultDaysOff
      });
    }
  }, [state.users]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.users.length === 0) {
      setError('Aucun utilisateur trouvé');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = {
        ...state.users[0],
        ...formData,
        updatedAt: new Date().toISOString()
      };
      
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser
      });

      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour du profil');
      console.error('Erreur lors de la mise à jour du profil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir régénérer votre clé API ? Cette action est irréversible.')) {
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

  // Fonction pour afficher le contenu de l'onglet actif
  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'team':
        return <TeamManagement onEditMember={handleOpenTeamModal} />;
      
      case 'email':
        return <EmailSettings />;
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-6">Paramètres de notification</h2>
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Préférences de notification</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications par email</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recevez des notifications importantes par email</p>
                      </div>
                      <button
                        onClick={() => dispatch({ 
                          type: 'UPDATE_USER', 
                          payload: { 
                            emailNotifications: !state.users[0]?.emailNotifications 
                          } 
                        })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${state.users[0]?.emailNotifications !== false ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                        role="switch"
                        aria-checked={state.users[0]?.emailNotifications !== false}
                      >
                        <span className="sr-only">Notifications email</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state.users[0]?.emailNotifications !== false ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications push</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recevez des notifications sur votre appareil</p>
                      </div>
                      <button
                        onClick={() => dispatch({ 
                          type: 'UPDATE_USER', 
                          payload: { 
                            pushNotifications: !state.users[0]?.pushNotifications 
                          } 
                        })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${state.users[0]?.pushNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                        role="switch"
                        aria-checked={state.users[0]?.pushNotifications}
                      >
                        <span className="sr-only">Notifications push</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state.users[0]?.pushNotifications ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Types de notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            id="notif-news"
                            name="notif-news"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            defaultChecked
                          />
                          <label htmlFor="notif-news" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nouvelles fonctionnalités
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="notif-updates"
                            name="notif-updates"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            defaultChecked
                          />
                          <label htmlFor="notif-updates" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Mises à jour système
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="notif-promo"
                            name="notif-promo"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            defaultChecked
                          />
                          <label htmlFor="notif-promo" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Offres promotionnelles
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return <AISettings />;

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-6">Apparence</h2>
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode sombre</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Activez le mode sombre pour un confort visuel optimal</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${state.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}`}
                      role="switch"
                      aria-checked={state.theme === 'dark'}
                    >
                      <span className="sr-only">Mode sombre</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Couleur d'accent</h4>
                    <div className="flex space-x-3">
                      {['blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'emerald', 'teal', 'cyan'].map((color) => (
                        <button
                          key={color}
                          onClick={() => dispatch({ type: 'SET_ACCENT_COLOR', payload: color })}
                          className={`w-8 h-8 rounded-full bg-${color}-500`}
                          title={color.charAt(0).toUpperCase() + color.slice(1)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Taille de la police</h4>
                    <div className="flex items-center space-x-4">
                      <button className="text-xs px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Petit</button>
                      <button className="text-sm px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium">Moyen</button>
                      <button className="text-base px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Grand</button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Densité de l'interface</h4>
                    <div className="flex items-center space-x-4">
                      <button className="text-sm px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Compact</button>
                      <button className="text-sm px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium">Normal</button>
                      <button className="text-sm px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Confortable</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'profile':
      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
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
                      // Réinitialiser le formulaire
                      const primaryUser = state.users[0];
                      setFormData({
                        name: primaryUser.name,
                        email: primaryUser.email,
                        phone: primaryUser.phone || '',
                        position: primaryUser.position || '',
                        department: primaryUser.department || '',
                        language: primaryUser.language || 'fr',
                        timezone: primaryUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                        emailNotifications: primaryUser.emailNotifications !== false,
                        pushNotifications: primaryUser.pushNotifications !== false
                      });
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    form="profile-form"
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Poste
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Département
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Langue
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language || 'fr'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fuseau horaire
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={formData.timezone || 'Europe/Paris'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    >
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jours de repos hebdomadaires
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = formData.daysOff?.includes(day) || formData.settings?.daysOff?.includes(day);
                        return (
                          <div key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`day-${day}`}
                              checked={isSelected}
                              onChange={() => {
                                setFormData(prev => {
                                  const currentDays = Array.isArray(prev.daysOff) ? [...prev.daysOff] : [];
                                  const newDays = isSelected 
                                    ? currentDays.filter(d => d !== day)
                                    : [...currentDays, day];
                                  
                                  return {
                                    ...prev,
                                    daysOff: newDays,
                                    settings: {
                                      ...prev.settings,
                                      daysOff: newDays
                                    }
                                  };
                                });
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                              disabled={isLoading}
                            />
                            <label 
                              htmlFor={`day-${day}`} 
                              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                            >
                              {getDayName(day)}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {(!formData.daysOff?.length && !formData.settings?.daysOff?.length) && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Aucun jour de repos sélectionné
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Préférences de notification</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        name="emailNotifications"
                        checked={!!formData.emailNotifications}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                        disabled={isLoading}
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Recevoir les notifications par email
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="pushNotifications"
                        name="pushNotifications"
                        checked={!!formData.pushNotifications}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                        disabled={isLoading}
                      />
                      <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Activer les notifications push
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Informations du profil</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                      Détails personnels et informations de contact
                    </p>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <dl>
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom complet</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {formData.name || 'Non spécifié'}
                        </dd>
                      </div>
                      <div className="bg-white dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {formData.email || 'Non spécifié'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {formData.phone || 'Non spécifié'}
                        </dd>
                      </div>
                      <div className="bg-white dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Poste</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {formData.position || 'Non spécifié'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Département</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {formData.department || 'Non spécifié'}
                        </dd>
                      </div>
                      <div className="bg-white dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Langue</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {formData.language === 'fr' ? 'Français' : 
                           formData.language === 'en' ? 'English' : 
                           formData.language === 'es' ? 'Español' : 
                           formData.language || 'Non spécifié'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fuseau horaire</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {formData.timezone === 'Europe/Paris' ? 'Europe/Paris (CET)' :
                           formData.timezone === 'UTC' ? 'UTC' :
                           formData.timezone === 'America/New_York' ? 'America/New York (EST)' :
                           formData.timezone === 'Asia/Tokyo' ? 'Asia/Tokyo (JST)' :
                           formData.timezone || 'Non spécifié'}
                        </dd>
                      </div>
                      <div className="bg-white dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Notifications email</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            formData.emailNotifications 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {formData.emailNotifications ? 'Activées' : 'Désactivées'}
                          </span>
                        </dd>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notifications push</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            formData.pushNotifications 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {formData.pushNotifications ? 'Activées' : 'Désactivées'}
                          </span>
                        </dd>
                      </div>
                      <div className="bg-white dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Jours de repos</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {(!formData.daysOff?.length && !formData.settings?.daysOff?.length) ? (
                            <span className="text-gray-500 dark:text-gray-400">Aucun jour de repos défini</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(formData.daysOff || formData.settings?.daysOff || []).map(day => (
                                <span 
                                  key={day}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                >
                                  {getDayName(day as DayOfWeek)}
                                </span>
                              ))}
                            </div>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec les onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800" role="alert">
          {success}
        </div>
      )}

      {/* Contenu de l'onglet actif */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {renderTabContent()}
      </div>

      {/* Bouton de débogage */}
      <button 
        onClick={debugForceSettings}
        className="fixed bottom-4 left-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Forcer le rechargement en mode débogage"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Modal d'équipe */}
      <TeamModal 
        isOpen={isTeamModalOpen} 
        onClose={handleCloseTeamModal} 
        member={currentMember}
        onSubmit={handleTeamMemberSubmit}
      />
    </div>
  );
}
