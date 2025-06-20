import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { Sidebar } from './Layout/Sidebar';
import { TodayView } from './Views/TodayView';
import { ProjectsView } from './Views/ProjectsView';
import { KanbanView } from './Views/KanbanView';
import { CalendarView } from './Views/CalendarView';

function AppContent() {
  const { state } = useApp();

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'today':
        return <TodayView />;
      case 'projects':
        return <ProjectsView />;
      case 'kanban':
        return <KanbanView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <TodayView />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
}

export default function ProjectManager() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}