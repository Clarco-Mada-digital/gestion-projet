import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ToastProvider, useToast } from './components/UI/Toast/Toast';
import { errorHandler } from './lib/error/errorHandler';
import App from './App';
import { store } from './store/store';
import AppInitializer from './components/AppInitializer';
import './index.css';

// Composant wrapper pour initialiser le gestionnaire d'erreurs
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  
  // Initialiser le gestionnaire d'erreurs avec le système de toast
  React.useEffect(() => {
    errorHandler.initialize(showToast);
  }, [showToast]);

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

// Composant racine de l'application
function Root() {
  return (
    <StrictMode>
      <Provider store={store}>
        <Router>
          <AppInitializer>
            <ErrorBoundaryWrapper>
              <App />
            </ErrorBoundaryWrapper>
          </AppInitializer>
        </Router>
      </Provider>
    </StrictMode>
  );
}

// Rendu de l'application avec le fournisseur de toasts
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ToastProvider>
      <Root />
    </ToastProvider>
  );
} else {
  console.error('Failed to find the root element');
}
