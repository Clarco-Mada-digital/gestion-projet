import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { TodayView } from './components/Views/TodayView';
import { ProjectsView } from './components/Views/ProjectsView';
import { KanbanView } from './components/Views/KanbanView';
import { CalendarView } from './components/Views/CalendarView';

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}