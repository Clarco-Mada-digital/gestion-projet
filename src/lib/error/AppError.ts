export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'API_ERROR';

export interface ErrorContext {
  [key: string]: any;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly context?: ErrorContext;
  public readonly originalError?: unknown;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = 'INTERNAL_SERVER_ERROR',
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date();
    
    // Maintient la chaîne de prototype correcte
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  public static fromError(error: unknown, type?: ErrorType, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(
        error.message,
        type || 'INTERNAL_SERVER_ERROR',
        context,
        error
      );
    }
    
    return new AppError(
      String(error),
      type || 'INTERNAL_SERVER_ERROR',
      context,
      error
    );
  }
}
