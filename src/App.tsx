import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ModalProvider } from './context/ModalContext';
import { MainLayout } from './components/Layout/MainLayout';
import { TodayView } from './components/Views/TodayView';
import { ProjectsView } from './components/Views/ProjectsView';
import { KanbanView } from './components/Views/KanbanView';
import { CalendarView } from './components/Views/CalendarView';
import { SettingsView } from './components/Views/SettingsView';
import { ReportView } from './components/Views/ReportView';

// Fonction utilitaire pour charger l'état depuis le localStorage
const loadStateFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem('astroProjectManagerData');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données depuis le localStorage:', error);
  }
  return null;
};

function AppContent() {
  // Extraire toutes les valeurs nécessaires du contexte en un seul appel
  const { state, dispatch } = useApp();
  const { currentView, appSettings } = state;
  const { fontSize = 'medium' } = appSettings || {};
  
  // Appliquer la classe de taille de police au body
  useEffect(() => {
    // Supprimer les classes de taille de police existantes
    document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    
    // Ajouter la classe de taille de police actuelle
    document.body.classList.add(`font-size-${fontSize}`);
    
    // Mettre à jour la propriété CSS personnalisée pour la taille de police de base
    document.documentElement.style.setProperty('--font-size-base', 
      fontSize === 'small' ? '0.875rem' : 
      fontSize === 'large' ? '1.125rem' : '1rem'
    );
  }, [fontSize]);
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Effet pour le chargement initial
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        // Charger les données depuis le localStorage
        const savedData = loadStateFromLocalStorage();
        if (savedData) {
          // Mettre à jour l'état avec les données chargées
          if (savedData.currentView) {
            dispatch({ type: 'SET_VIEW', payload: savedData.currentView });
          }
          
          if (savedData.theme) {
            dispatch({ type: 'SET_THEME', payload: savedData.theme });
          }
          
          if (savedData.appSettings) {
            dispatch({ type: 'UPDATE_APP_SETTINGS', payload: savedData.appSettings });
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
      } finally {
        // Simuler un temps de chargement minimum
        await new Promise(resolve => setTimeout(resolve, 800));
        if (isMounted) {
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    };

    if (!hasLoaded) {
      initializeApp();
    }

    return () => {
      isMounted = false;
    };
  }, [dispatch, hasLoaded]);

  // Effet pour suivre les changements de vue
  useEffect(() => {
    if (hasLoaded && !isLoading) {
      console.log('=== CHANGEMENT DE VUE DETECTE ===');
      console.log('Nouvelle vue:', currentView);
    }
  }, [currentView, hasLoaded, isLoading]);

  // Écran de chargement
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

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      <MainLayout currentView={currentView}>
        {currentView === 'today' && <TodayView />}
        {currentView === 'projects' && <ProjectsView />}
        {currentView === 'kanban' && <KanbanView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'reports' && <ReportView />}
        {currentView === 'settings' && <SettingsView />}
      </MainLayout>
    </div>
  );
}

// Composant pour regrouper les fournisseurs
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
      <AppContent />
      {/* <DebugPanel /> */}
    </AppProviders>
  );
}