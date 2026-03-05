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
  const { state, dispatch } = useApp();
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

  // Gérer la navigation depuis les notifications push (paramètres URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('task');

    if (taskId) {
      // Trouver le projet qui contient cette tâche
      const allTasks = state.projects.flatMap(p => p.tasks || []);
      const task = allTasks.find(t => t.id === taskId);
      
      if (task) {
        // Navigation depuis une notification push
        dispatch({
          type: 'NAVIGATE_TO_TASK',
          payload: { projectId: task.projectId, taskId: task.id }
        });
        
        // Nettoyer l'URL pour éviter de naviguer à nouveau au refresh
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [dispatch, state.projects]);

  // Vérifier que la PWA est correctement configurée
  useEffect(() => {
    // Vérifier le support PWA de base
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasManifest = 'manifest' in document.createElement('link'); // Note: ce test n'est pas très fiable
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const isHTTPS = location.protocol === 'https:' || isLocalhost;

    console.log('🔍 Diagnostic PWA:');
    console.log('   Service Worker:', hasServiceWorker ? '✅' : '❌');
    console.log('   HTTPS/Localhost:', isHTTPS ? '✅' : '❌');
    console.log('   URL actuelle:', location.href);

    // Vérifier si le manifest est chargé par le navigateur
    if ('onbeforeinstallprompt' in window) {
      console.log('   BeforeInstallPrompt supporté: ✅');
    } else {
      console.log('   BeforeInstallPrompt supporté: ❌');
    }

    // Tester l'accès au manifest
    fetch('./manifest.json')
      .then(response => {
        console.log('   Manifest HTTP status:', response.status);
        if (response.ok) {
          return response.json();
        }
        throw new Error(`HTTP ${response.status}`);
      })
      .then(data => {
        console.log('   Manifest JSON valide: ✅');
        console.log('   Nom de l\'app:', data.name);
        console.log('   Icônes définies:', data.icons?.length || 0);

        // Vérifier si les icônes sont accessibles
        if (data.icons && data.icons.length > 0) {
          const iconUrl = data.icons[0].src;
          return fetch(iconUrl).then(iconResponse => {
            console.log('   Icône accessible:', iconResponse.ok ? '✅' : '❌');
          });
        }
      })
      .catch(error => {
        console.log('   Erreur manifest:', error.message);
      });

    // Écouter les événements PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎉 EVENT: beforeinstallprompt - PWA installable!');
      console.log('   Pour afficher le bouton, appelez e.prompt()');
    };

    const handleAppInstalled = () => {
      console.log('✅ EVENT: appinstalled - PWA installée!');
    };

    // Enregistrer le Service Worker pour la PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker enregistré pour PWA:', registration.scope);
        })
        .catch(error => {
          console.log('❌ Erreur enregistrement Service Worker:', error);
        });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

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
        <ChatbotProvider>
          {children}
        </ChatbotProvider>
      </ModalProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}