import React from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
}

export function MainLayout({ children, currentView }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Sidebar currentView={currentView} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-10xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
