import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { User, TeamMember, DayOfWeek, getDayName, DAYS_OF_WEEK } from '../../types';
import { Card } from '../UI/Card';
import { TeamManagement } from '../Settings/TeamManagement';
import { TeamModal } from '../Modals/TeamModal';
import { EmailSettings } from '../Settings/EmailSettings';
import { AISettings } from '../Settings/AISettings';
import { DataManagement } from '../Settings/DataManagement';
import { ContactManagement } from '../Settings/ContactManagement';
import { AppearanceSettings } from '../Settings/AppearanceSettings';
import {
  User as UserIcon,
  Users,
  Mail,
  Database,
  Bell,
  Palette,
  Cpu,
  Contact as ContactIcon,
  ChevronRight,
  Settings as SettingsIcon,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';

export function SettingsView() {

  const { state, dispatch } = useApp();


  // États pour la gestion des onglets et des modales
  const [activeTab, setActiveTab] = useState('profile');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);

  // Liste des onglets avec icônes
  const tabs = [
    { id: 'profile', name: 'Profil', icon: UserIcon, subtitle: 'Infos personnelles & compte' },
    { id: 'appearance', name: 'Apparence', icon: Palette, subtitle: 'Thèmes, couleurs & branding' },
    { id: 'team', name: 'Équipe', icon: Users, subtitle: 'Membres & permissions' },
    { id: 'contacts', name: 'Contacts', icon: ContactIcon, subtitle: 'Gestion du répertoire' },
    { id: 'email', name: 'Email', icon: Mail, subtitle: 'Configuration SMTP/EmailJS' },
    { id: 'ai', name: 'IA Settings', icon: Cpu, subtitle: 'OpenAI, OpenRouter & modèles' },
    { id: 'notifications', name: 'Notifications', icon: Bell, subtitle: 'Alertes & préférences' },
    { id: 'data', name: 'Données', icon: Database, subtitle: 'Export, Import & Backup' },
  ];

  // États pour le formulaire de profil
  const [formData, setFormData] = useState<Partial<User>>({
    settings: {
      theme: 'light',
      language: 'fr',
      timezone: 'Europe/Paris',
      notifications: true,
      emailNotifications: true,
      pushNotifications: true,
      daysOff: ['sunday'] as DayOfWeek[]
    },
    daysOff: ['sunday'] as DayOfWeek[]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


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
            theme: currentMember.settings?.theme || 'light',
            language: memberData.language || currentMember.settings?.language || 'fr',
            timezone: memberData.timezone || currentMember.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: currentMember.settings?.notifications ?? true,
            emailNotifications: memberData.emailNotifications !== undefined
              ? memberData.emailNotifications
              : currentMember.settings?.emailNotifications !== false,
            pushNotifications: memberData.pushNotifications !== undefined
              ? memberData.pushNotifications
              : currentMember.settings?.pushNotifications ?? true
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
          id: uuidv4(),
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: {
            theme: 'light',
            language: memberData.language || 'fr',
            timezone: memberData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: true,
            emailNotifications: memberData.emailNotifications !== false,
            pushNotifications: memberData.pushNotifications !== false
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
          theme: primaryUser.settings?.theme || 'light',
          language: primaryUser.settings?.language || 'fr',
          timezone: primaryUser.settings?.timezone || 'Europe/Paris',
          notifications: primaryUser.settings?.notifications ?? true,
          emailNotifications: primaryUser.settings?.emailNotifications ?? true,
          daysOff: Array.isArray(userDaysOff) ? (userDaysOff as DayOfWeek[]) : (defaultDaysOff as DayOfWeek[])
        },
        daysOff: Array.isArray(userDaysOff) ? (userDaysOff as DayOfWeek[]) : (defaultDaysOff as DayOfWeek[]),
        avatar: primaryUser.avatar || primaryUser.photoURL || ''
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


  const renderTabContent = () => {
    switch (activeTab) {
      case 'team':
        return <TeamManagement onEditMember={handleOpenTeamModal} />;

      case 'contacts':
        return (
          <ContactManagement
            contacts={state.appSettings.contacts || []}
            onUpdateContacts={(updatedContacts) => {
              dispatch({
                type: 'UPDATE_APP_SETTINGS',
                payload: {
                  contacts: updatedContacts
                }
              });
            }}
          />
        );

      case 'email':
        return <EmailSettings />;

      case 'data':
        return <DataManagement />;

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
        return <AppearanceSettings />;

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
                <div className="flex flex-col items-center mb-6 space-y-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        formData.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                  </div>
                  <div className="w-full max-w-xs space-y-1">
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      URL de l'avatar
                    </label>
                    <input
                      type="text"
                      id="avatar"
                      name="avatar"
                      value={formData.avatar || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                      placeholder="https://example.com/photo.jpg"
                      disabled={isLoading}
                    />
                  </div>
                </div>

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
                                  const currentDays = Array.isArray(prev.daysOff) ? [...prev.daysOff] : [] as DayOfWeek[];
                                  const newDays = isSelected
                                    ? currentDays.filter(d => d !== day)
                                    : [...currentDays, day as DayOfWeek];

                                  return {
                                    ...prev,
                                    daysOff: newDays,
                                    settings: {
                                      ...prev.settings,
                                      theme: prev.settings?.theme || 'light',
                                      language: prev.settings?.language || 'fr',
                                      timezone: prev.settings?.timezone || 'Europe/Paris',
                                      notifications: prev.settings?.notifications ?? true,
                                      emailNotifications: prev.settings?.emailNotifications ?? true,
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
                  <div className="px-4 py-5 sm:px-6 flex items-center space-x-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden shrink-0">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        formData.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{formData.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formData.position || 'Utilisateur'}</p>
                    </div>
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.emailNotifications
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.pushNotifications
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
            )
            }
          </div >
        );
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Messages de feedback flottants ou fixes */}
      {(error || success) && (
        <div className="fixed top-20 right-8 z-[100] space-y-2 max-w-sm animate-in slide-in-from-right-full">
          {error && (
            <div className="p-4 flex items-center bg-red-50 border border-red-200 text-red-700 rounded-2xl shadow-xl dark:bg-red-900/40 dark:border-red-800 dark:text-red-300 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto pl-4 text-red-500 hover:text-red-700">&times;</button>
            </div>
          )}
          {success && (
            <div className="p-4 flex items-center bg-green-50 border border-green-200 text-green-700 rounded-2xl shadow-xl dark:bg-green-900/40 dark:border-green-800 dark:text-green-300 backdrop-blur-md">
              <Check className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
              <button onClick={() => setSuccess(null)} className="ml-auto pl-4 text-green-500 hover:text-green-700">&times;</button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-80 flex-shrink-0 space-y-2 bg-white/50 dark:bg-gray-800/40 backdrop-blur-xl p-4 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm sticky top-0">
          <div className="px-4 py-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-blue-500" />
              <span>Paramètres</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-semibold">Configuration Globale</p>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full group flex items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                  : 'text-gray-600 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <tab.icon className={`mr-3.5 flex-shrink-0 h-5 w-5 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                  }`} aria-hidden="true" />
                <div className="flex flex-col items-start text-left">
                  <span className="font-bold">{tab.name}</span>
                  <span className={`text-[10px] hidden sm:block ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {tab.subtitle}
                  </span>
                </div>
                {activeTab === tab.id && <ChevronRight className="ml-auto w-4 h-4 text-white/50" />}
              </button>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/20">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Local storage</span>
              </div>
              <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                Vos données sont privées et stockées localement. Exportez régulièrement vos backups.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="p-8 h-full min-h-[600px] border-none shadow-xl bg-white/60 dark:bg-gray-800/60 transition-all duration-300">
            {renderTabContent()}
          </Card>
        </div>
      </div>

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