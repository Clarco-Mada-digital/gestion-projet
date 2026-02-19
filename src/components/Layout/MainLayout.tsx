import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from '../UI/NotificationCenter';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
}

export function MainLayout({ children, currentView }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">
              {currentView === 'today' && "Tableau de Bord"}
              {currentView === 'projects' && "Mes Projets"}
              {currentView === 'tasks' && "Mes Tâches"}
              {currentView === 'calendar' && "Calendrier"}
              {currentView === 'team' && "Équipe & Collaboration"}
              {currentView === 'settings' && "Paramètres"}
              {currentView === 'reports' && "Rapports"}
              {currentView === 'about' && "Aide & À Propos"}
              {!['today', 'projects', 'tasks', 'calendar', 'team', 'settings', 'reports', 'about'].includes(currentView) && (currentView.charAt(0).toUpperCase() + currentView.slice(1))}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationCenter />
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2 hidden xs:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                Explorer
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto custom-scrollbar">
          <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
