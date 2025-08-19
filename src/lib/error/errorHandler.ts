import { AppError, ErrorType } from './AppError';
import * as Sentry from '@sentry/react';
const { captureException } = Sentry;

type ErrorHandlerOptions = {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToSentry?: boolean;
};

const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: process.env.NODE_ENV !== 'production',
  reportToSentry: process.env.NODE_ENV === 'production',
};

class ErrorHandler {
  private static instance: ErrorHandler;
  private toastHandler?: (message: string, type: 'error' | 'warning' | 'info') => void;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public initialize(toastHandler: (message: string, type: 'error' | 'warning' | 'info') => void) {
    this.toastHandler = toastHandler;
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Gestion des erreurs non capturées dans les promesses
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      this.handleError(error, {
        context: { source: 'unhandledrejection' },
      });
    });

    // Gestion des erreurs non capturées
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message || 'Une erreur inconnue est survenue');
      this.handleError(error, {
        context: { 
          source: 'window.onerror',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  public handleError(
    error: unknown,
    options: ErrorHandlerOptions & { 
      type?: ErrorType;
      context?: Record<string, any>;
    } = {}
  ): AppError {
    const { type, context, ...handlerOptions } = options;
    const mergedOptions = { ...defaultOptions, ...handlerOptions };
    
    // Convertir en AppError si ce n'est pas déjà le cas
    const appError = AppError.fromError(error, type, context);

    // Journalisation
    if (mergedOptions.logToConsole) {
      console.error('Error handled:', appError);
    }

    // Rapport d'erreur à Sentry
    if (mergedOptions.reportToSentry) {
      captureException(appError, {
        contexts: {
          error: {
            ...appError.context,
            type: appError.type,
            originalError: appError.originalError,
          },
        },
      });
    }

    // Affichage à l'utilisateur
    if (mergedOptions.showToast && this.toastHandler) {
      this.toastHandler(
        this.getUserFriendlyMessage(appError),
        this.getErrorSeverity(appError.type)
      );
    }

    return appError;
  }

  private getUserFriendlyMessage(error: AppError): string {
    const { message, type } = error;
    
    switch (type) {
      case 'NETWORK_ERROR':
        return 'Erreur de connexion. Veuillez vérifier votre connexion Internet et réessayer.';
      case 'AUTH_ERROR':
        return 'Session expirée. Veuillez vous reconnecter.';
      case 'VALIDATION_ERROR':
        return `Erreur de validation: ${message}`;
      case 'NOT_FOUND':
        return 'La ressource demandée est introuvable.';
      case 'FORBIDDEN':
        return 'Vous n\'êtes pas autorisé à effectuer cette action.';
      case 'TIMEOUT_ERROR':
        return 'La requête a expiré. Veuillez réessayer.';
      case 'API_ERROR':
        return `Erreur du serveur: ${message}`;
      default:
        return 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
    }
  }

  private getErrorSeverity(type: ErrorType): 'error' | 'warning' | 'info' {
    switch (type) {
      case 'VALIDATION_ERROR':
        return 'warning';
      case 'AUTH_ERROR':
      case 'FORBIDDEN':
        return 'warning';
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
        return 'warning';
      default:
        return 'error';
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Fonction utilitaire pour envelopper les appels asynchrones
export async function withErrorHandling<T>(
  promise: Promise<T>,
  options?: ErrorHandlerOptions & { 
    type?: ErrorType;
    context?: Record<string, any>;
  }
): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    errorHandler.handleError(error, options);
    return undefined;
  }
}

// Fonction pour les erreurs de validation
export function createValidationError(field: string, message: string): AppError {
  return new AppError(
    message,
    'VALIDATION_ERROR',
    { field }
  );
}
