import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ModalProvider } from './context/ModalContext';
import { MainLayout } from './components/Layout/MainLayout';

// Composant de débogage temporaire
function DebugPanel() {
  const { state, dispatch } = useApp();
  
  const forceSettingsView = () => {
    console.log('=== FORCAGE DE LA VUE PARAMÈTRES ===');
    // Forcer la vue paramètres
    dispatch({ type: 'SET_VIEW', payload: 'settings' });
    // Forcer la sauvegarde dans le localStorage
    const data = JSON.parse(localStorage.getItem('astroProjectManagerData') || '{}');
    data.currentView = 'settings';
    localStorage.setItem('astroProjectManagerData', JSON.stringify(data));
  };
  
  const resetView = () => {
    console.log('=== RÉINITIALISATION DE LA VUE ===');
    dispatch({ type: 'SET_VIEW', payload: 'today' });
  };
  
  const clearLocalStorage = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ?')) {
      console.log('=== RÉINITIALISATION DU LOCALSTORAGE ===');
      localStorage.removeItem('astroProjectManagerData');
      window.location.reload();
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <h3 className="font-bold mb-2 text-sm text-gray-700 dark:text-gray-300">Débogage</h3>
      <div className="space-y-2">
        <div className="text-xs mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
          <p>Vue actuelle: <span className="font-bold">{state.currentView}</span></p>
        </div>
        <button
          onClick={forceSettingsView}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
        >
          Forcer Paramètres
        </button>
        <button
          onClick={resetView}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
        >
          Réinitialiser Vue
        </button>
        <button
          onClick={clearLocalStorage}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded mt-2"
        >
          Réinitialiser Données
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  // Extraire toutes les valeurs nécessaires du contexte en un seul appel
  const { state, dispatch } = useApp();
  const { currentView } = state;
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Effet pour le chargement initial et le mode debug
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        // Vérifier le mode debug
        const forceSettings = localStorage.getItem('debug_force_settings') === 'true';
        if (forceSettings) {
          console.log('=== FORCAGE DE LA VUE SETTINGS (DEBUG) ===');
          localStorage.removeItem('debug_force_settings');
          if (isMounted) {
            setDebugMode(true);
            dispatch({ type: 'SET_VIEW', payload: 'settings' });
          }
        }

        // Charger les données
        const savedData = localStorage.getItem('astroProjectManagerData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (isMounted) {
            dispatch({ type: 'LOAD_STATE', payload: parsedData });
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

  return <MainLayout />;
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
      <DebugPanel />
    </AppProviders>
  );
}