import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../../lib/error/AppError';
import { errorHandler } from '../../lib/error/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: AppError) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: AppError;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour que le prochain rendu affiche l'UI de repli
    const appError = AppError.fromError(error, 'INTERNAL_SERVER_ERROR', {
      source: 'react-error-boundary',
    });
    
    return { 
      hasError: true, 
      error: appError 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Vous pouvez également enregistrer l'erreur dans un service de rapport d'erreurs
    const appError = AppError.fromError(error, 'INTERNAL_SERVER_ERROR', {
      componentStack: errorInfo.componentStack,
      source: 'react-error-boundary',
    });

    // Gérer l'erreur via notre gestionnaire global
    errorHandler.handleError(appError, {
      showToast: true,
      logToConsole: true,
    });

    // Appeler le gestionnaire d'erreurs personnalisé s'il est fourni
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }

    this.setState({ error: appError, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Afficher l'UI personnalisée de repli
      if (fallback) {
        return fallback(error);
      }

      // UI de repli par défaut
      return (
        <div className="p-6 max-w-md mx-auto mt-10 bg-red-50 rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Oups ! Quelque chose s'est mal passé
            </h2>
            <p className="text-red-600 mb-4">
              {error.message || 'Une erreur inattendue est survenue'}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left text-sm text-gray-600 mb-4">
                <summary className="cursor-pointer mb-2">Détails techniques</summary>
                <pre className="bg-white p-3 rounded overflow-auto text-xs">
                  {error.stack}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

// HOC pour utiliser plus facilement le ErrorBoundary
export function withErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options: Omit<Props, 'children'> = {}
) {
  return (props: T) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...(props as any)} />
    </ErrorBoundary>
  );
}
