import React from 'react';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from '../UI/NotificationCenter';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
}

export function MainLayout({ children, currentView }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {currentView === 'today' && "Tableau de Bord"}
              {currentView === 'projects' && "Mes Projets"}
              {currentView === 'tasks' && "Mes Tâches"}
              {currentView === 'calendar' && "Calendrier"}
              {currentView === 'team' && "Équipe & Collaboration"}
              {currentView === 'settings' && "Paramètres"}
              {!['today', 'projects', 'tasks', 'calendar', 'team', 'settings'].includes(currentView) && (currentView.charAt(0).toUpperCase() + currentView.slice(1))}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                Explorer
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-10xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
