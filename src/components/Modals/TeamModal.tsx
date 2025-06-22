import React, { useState, useEffect } from 'react';
import { TeamMember } from '../../types';
import { UserCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { X } from 'lucide-react';
import { div } from 'framer-motion/client';

// Options pour les listes déroulantes
const departments = ['Développement', 'Design', 'Marketing', 'Ventes', 'Support', 'Direction'];
const roles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Membre' }
];
const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' }
];
const timezones = [
  { value: 'Indian/Antananarivo', label: 'Antananarivo (GMT+3)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+2)' },
  { value: 'UTC', label: 'UTC' }
];

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: TeamMember | null;
  onSubmit: (memberData: Partial<TeamMember>) => void;
}

export function TeamModal({ isOpen, onClose, member, onSubmit }: TeamModalProps) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    role: 'member',
    emailNotifications: true,
    pushNotifications: true,
    language: 'fr',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        position: member.position || '',
        department: member.department || '',
        role: member.role || 'member',
        emailNotifications: member.emailNotifications !== false,
        pushNotifications: member.pushNotifications !== false,
        language: member.language || 'fr',
        timezone: member.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        role: 'member',
        emailNotifications: true,
        pushNotifications: true,
        language: 'fr',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [member]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!formData.name || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Préparation des données à soumettre
    const memberData: Partial<User> = {
      ...formData,
      // Ne pas générer d'ID ici, il sera généré par le reducer
      role: formData.role as 'admin' | 'member' | 'viewer' || 'member', // Assurer un rôle valide
      status: 'active',
      // Ne pas générer de dates ici, elles seront gérées par le reducer
      avatar: '',
      // Valeurs par défaut pour les champs requis
      emailNotifications: formData.emailNotifications !== false,
      pushNotifications: formData.pushNotifications !== false,
      language: formData.language || 'fr',
      timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      lastActive: new Date().toISOString(),
      settings: member?.settings || {
        theme: 'light',
        language: formData.language || 'fr',
        timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: true,
        emailNotifications: formData.emailNotifications !== false
      }
    };
    
    onSubmit(memberData);
    onClose();
  };

  // Gestion du défilement de la page
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}
      />
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
        style={{
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '32rem',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {member ? 'Modifier le membre' : 'Ajouter un membre'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
              aria-label="Fermer la modale"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {member ? 'Mettez à jour les informations du membre' : 'Ajoutez un nouveau membre à votre équipe'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar et informations de base */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-6">
              <div className="relative group">
                <div className="relative h-20 w-20 rounded-full bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 overflow-hidden">
                  <UserCircleIcon className="h-full w-full text-gray-300 dark:text-gray-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PhotoIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-700 p-1 rounded-full shadow-md">
                  <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo de profil</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">PNG, JPG, GIF jusqu'à 2MB</p>
                <div>
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
                    <PhotoIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Choisir une image</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Handle file upload logic here
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Nom complet */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white placeholder-gray-400"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white placeholder-gray-400"
                    placeholder="jean.dupont@example.com"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Téléphone
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white placeholder-gray-400"
                    placeholder="+261 32 12 345 67"
                  />
                </div>
              </div>

              {/* Poste */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Poste
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="position"
                    id="position"
                    value={formData.position || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white placeholder-gray-400"
                    placeholder="Développeur Full Stack"
                  />
                </div>
              </div>

              {/* Département */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Département
                </label>
                <div className="mt-1">
                  <select
                    name="department"
                    id="department"
                    value={formData.department || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Sélectionner un département</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rôle */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rôle
                </label>
                <div className="mt-1">
                  <select
                    name="role"
                    id="role"
                    value={formData.role || 'member'}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fuseau horaire */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fuseau horaire
                </label>
                <div className="mt-1">
                  <select
                    name="timezone"
                    id="timezone"
                    value={formData.timezone || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Langue */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Langue
                </label>
                <div className="mt-1">
                  <select
                    name="language"
                    id="language"
                    value={formData.language || 'fr'}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150 sm:text-sm border py-2.5 px-3.5 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                  >
                    {languages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notifications */}
              <div className="sm:col-span-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Préférences de notification</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        id="emailNotifications"
                        checked={formData.emailNotifications !== false}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="emailNotifications" className="font-medium text-gray-700 dark:text-gray-300">
                        Recevoir les notifications par email
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">Les mises à jour importantes vous seront envoyées par email</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        id="pushNotifications"
                        checked={formData.pushNotifications !== false}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="pushNotifications" className="font-medium text-gray-700 dark:text-gray-300">
                        Activer les notifications push
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">Recevez des notifications en temps réel dans votre navigateur</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white dark:bg-gray-700 py-2.5 px-5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex justify-center items-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 px-5 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                {member ? 'Mettre à jour le membre' : 'Ajouter le membre'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
