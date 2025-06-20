import React from 'react';
import { Calendar, CheckSquare, FolderOpen, Kanban, Moon, Sun, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';

export function Sidebar() {
  const { state, dispatch } = useApp();

  const menuItems = [
    { id: 'today' as ViewMode, label: 'Aujourd\'hui', icon: CheckSquare, color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'projects' as ViewMode, label: 'Projets', icon: FolderOpen, color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'kanban' as ViewMode, label: 'Kanban', icon: Kanban, color: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
    { id: 'calendar' as ViewMode, label: 'Calendrier', icon: Calendar, color: 'text-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
  ];

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <div className="w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-2xl">
      {/* Header avec effet glassmorphisme */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              ProjectFlow
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Powered by Astro.js
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gestion de projets moderne et futuriste
        </p>
      </div>

      {/* Navigation avec animations */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
              className={`w-full group relative overflow-hidden flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                isActive
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
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100/50 hover:to-gray-200/50 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all duration-300 group"
        >
          <div className="relative">
            {state.theme === 'light' ? (
              <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            ) : (
              <Sun className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            )}
          </div>
          <span className="font-medium">
            {state.theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}
          </span>
        </button>

        <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/30 dark:border-blue-700/30">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {state.users[0].avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {state.users[0].name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {state.users[0].email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}