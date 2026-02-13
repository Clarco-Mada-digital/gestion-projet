import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ModalProvider } from './context/ModalContext';
import { ChatbotProvider } from './context/ChatbotContext';
import { MainLayout } from './components/Layout/MainLayout';
import { TodayView } from './components/Views/TodayView';
import { ProjectsView } from './components/Views/ProjectsView';
import { KanbanView } from './components/Views/KanbanView';
import { CalendarView } from './components/Views/CalendarView';
import { SettingsView } from './components/Views/SettingsView';
import { ReportView } from './components/Views/ReportView';
import { AboutView } from './components/Views/AboutView';
import Chatbot from './components/Chatbot';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const { state } = useApp();
  const { currentView, appSettings } = state;
  const { fontSize = 'medium' } = appSettings || {};

  // Appliquer la classe de taille de police au body
  useEffect(() => {
    document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    document.body.classList.add(`font-size-${fontSize}`);
    document.documentElement.style.setProperty('--font-size-base',
      fontSize === 'small' ? '0.875rem' :
        fontSize === 'large' ? '1.125rem' : '1rem'
    );
  }, [fontSize]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Chargement de l'application...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'today': return <TodayView />;
      case 'projects': return <ProjectsView />;
      case 'kanban': return <KanbanView />;
      case 'calendar': return <CalendarView />;
      case 'reports': return <ReportView />;
      case 'settings': return <SettingsView />;
      case 'about': return <AboutView />;
      default: return <TodayView />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      <MainLayout currentView={currentView}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
        <Chatbot />
      </MainLayout>
    </div>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AppProviders>
      <ChatbotProvider>
        <AppContent />
      </ChatbotProvider>
    </AppProviders>
  );
}