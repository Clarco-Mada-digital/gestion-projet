import { useEffect, useState } from 'react';
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
import { matchesShortcut } from './utils/keyboardUtils';
import { activityService } from './services/collaboration/activityService';
import { message } from 'antd';

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
    const replyTo = urlParams.get('replyTo');
    const replyText = urlParams.get('text');

    // Gérer les redirections depuis GitHub Pages 404.html
    const redirectPath = sessionStorage.getItem('_astro_redirect');
    if (redirectPath) {
      sessionStorage.removeItem('_astro_redirect');
      const pathParts = redirectPath.split('/').filter(p => p);
      // Supprimer le base path si présent
      if (pathParts[0] === 'gestion-projet') pathParts.shift();
      if (pathParts[0] === 'projects' && pathParts[2] === 'tasks') {
        const projectId = pathParts[1];
        const taskIdFromPath = pathParts[3];
        dispatch({
          type: 'NAVIGATE_TO_TASK',
          payload: { projectId, taskId: taskIdFromPath }
        });
        return;
      }
    }

    // Gérer l'envoi de réponse rapide (Quick Reply)
    if (replyTo && replyText && state.cloudUser) {
      const sendQuickReply = async () => {
        try {
          await activityService.logActivity({
            projectId: replyTo,
            type: 'project_discussion',
            actorId: state.cloudUser!.uid,
            actorName: state.cloudUser!.displayName || state.cloudUser!.email || 'Membre',
            actorAvatar: state.cloudUser!.photoURL || undefined,
            details: decodeURIComponent(replyText),
            targetId: replyTo,
            targetName: 'Discussion'
          });
          message.success("Réponse envoyée !");
          
          // Ouvrir la discussion pour voir le message
          dispatch({ type: 'SET_VIEW', payload: 'projects' });
          window.dispatchEvent(new CustomEvent('openProjectFeed', { 
            detail: state.projects.find(p => p.id === replyTo)
          }));
        } catch (err) {
          console.error("Erreur envoi Quick Reply:", err);
        }
      };
      
      sendQuickReply();
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }

    if (taskId) {
      const allTasks = state.projects.flatMap(p => p.tasks || []);
      const task = allTasks.find(t => t.id === taskId);

      if (task) {
        dispatch({
          type: 'NAVIGATE_TO_TASK',
          payload: { projectId: task.projectId, taskId: task.id }
        });

        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [dispatch, state.projects, state.cloudUser]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Gestion des raccourcis clavier de navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcuts = appSettings?.keyboardShortcuts;

      if (!shortcuts) return;

      // Navigation shortcuts
      if (matchesShortcut(shortcuts.navigateToday || 'ctrl+1', e)) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', payload: 'today' });
      } else if (matchesShortcut(shortcuts.navigateProjects || 'ctrl+2', e)) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', payload: 'projects' });
      } else if (matchesShortcut(shortcuts.navigateKanban || 'ctrl+3', e)) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', payload: 'kanban' });
      } else if (matchesShortcut(shortcuts.navigateCalendar || 'ctrl+4', e)) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', payload: 'calendar' });
      } else if (matchesShortcut(shortcuts.navigateReports || 'ctrl+5', e)) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', payload: 'reports' });
      } else if (matchesShortcut(shortcuts.navigateSettings || 'ctrl+6', e)) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', payload: 'settings' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [appSettings?.keyboardShortcuts, dispatch]);

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

export default function App() {
  return (
    <AppProvider>
      <ModalProvider>
        <ChatbotProvider>
          <AppContent />
        </ChatbotProvider>
      </ModalProvider>
    </AppProvider>
  );
}