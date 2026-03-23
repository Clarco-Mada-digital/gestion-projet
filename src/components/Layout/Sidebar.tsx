import { Calendar, CheckSquare, FileText, FolderOpen, Kanban, Moon, Sun, Sparkles, Settings, Info, X, LogIn, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';
import { firebaseService } from '../../services/collaboration/firebaseService';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { state, dispatch } = useApp();

  const menuItems = [
    { id: 'today' as ViewMode, label: 'Aujourd\'hui', icon: CheckSquare, color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'projects' as ViewMode, label: 'Projets', icon: FolderOpen, color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'kanban' as ViewMode, label: 'Kanban', icon: Kanban, color: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
    { id: 'calendar' as ViewMode, label: 'Calendrier', icon: Calendar, color: 'text-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'reports' as ViewMode, label: 'Rapports', icon: FileText, color: 'text-indigo-500', gradient: 'from-indigo-500 to-purple-500' },
    { id: 'vision' as ViewMode, label: 'Assistant Vision', icon: Sparkles, color: 'text-blue-600', gradient: 'from-blue-600 to-indigo-600', beta: true },
    { id: 'settings' as ViewMode, label: 'Paramètres', icon: Settings, color: 'text-amber-500', gradient: 'from-amber-500 to-orange-500' },
    { id: 'about' as ViewMode, label: 'À propos', icon: Info, color: 'text-pink-500', gradient: 'from-pink-500 to-rose-500' },
  ];

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-2xl transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Header avec bouton fermer pour mobile */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              {state.appSettings.brandingSettings?.logo ? (
                <img
                  src={state.appSettings.brandingSettings.logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent truncate max-w-[160px]">
                {state.appSettings.brandingSettings?.companyName || 'ProjectFlow'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-custom">
                {state.appSettings.brandingSettings?.welcomeMessage || 'Powered by Bryan Clark'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestion de projets moderne et futuriste
          </p>
        </div>

        {/* Navigation avec animations */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = state.currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  dispatch({ type: 'SET_VIEW', payload: item.id });
                  if (onClose) onClose(); // Fermer le sidebar sur mobile après clic
                }}
                className={`w-full group relative overflow-hidden flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${isActive
                  ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 shadow-xl border border-blue-200/50 dark:border-blue-700/50'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100/50 hover:to-gray-200/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50'
                  }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-10 rounded-2xl`} />
                )}
                <Icon className={`w-5 h-5 ${isActive ? item.color : ''} transition-colors duration-300`} />
                <span className="font-medium relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer avec profil utilisateur */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50">
          <div className="space-y-1">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100/50 hover:to-gray-200/50 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all duration-300 group"
            >
              <div className="relative">
                {state.theme === 'light' ? (
                  <Moon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                ) : (
                  <Sun className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                )}
              </div>
              <span className="text-sm font-medium">
                {state.theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}
              </span>
            </button>

            {/* Bouton de réinitialisation (uniquement si pas connecté pour éviter les accidents majeurs en cloud) */}
            {!state.cloudUser && (
              <button
                onClick={() => {
                  if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données locales ?')) {
                    localStorage.removeItem('astroProjectManagerData');
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-red-500/70 hover:text-red-500 dark:text-red-400/70 dark:hover:text-red-400 transition-all duration-300 group bg-transparent hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform duration-300">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M12 7v5l4 2"></path>
                  </svg>
                </div>
                <span className="text-xs font-medium">Réinitialiser Local</span>
              </button>
            )}
          </div>

          {state.cloudUser ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3 px-3 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-blue-100 dark:border-blue-900/30 shadow-sm relative overflow-hidden">
                {/* Effet de fond subtil pour le mode cloud */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden shrink-0 border-2 border-white dark:border-gray-700">
                  {state.cloudUser.photoURL ? (
                    <img
                      src={state.cloudUser.photoURL}
                      alt={state.cloudUser.displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    state.cloudUser.email?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {state.cloudUser.displayName || 'Utilisateur'}
                  </p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-tight flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                    MODE CLOUD
                  </p>
                </div>
              </div>
              
              <button 
                onClick={async () => {
                  if (window.confirm('Voulez-vous vous déconnecter du Cloud ? Vos données locales seront conservées.')) {
                    await firebaseService.logout();
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800/50 text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group shadow-sm"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Se déconnecter</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-3 px-3 py-3 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden shrink-0 border-2 border-white dark:border-gray-700 uppercase">
                  {state.users[0]?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    {state.users[0]?.name || 'Administrateur'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                    STOCKAGE LOCAL
                  </p>
                </div>
              </div>
              
              {!firebaseService.isReady() ? (
                <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center font-medium italic">
                    Firebase non configuré
                  </p>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await firebaseService.login();
                    } catch (e) {
                      console.error("Erreur de connexion:", e);
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Passer au Cloud</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}