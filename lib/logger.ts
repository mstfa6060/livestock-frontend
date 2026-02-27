const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

/**
 * Environment-gated logger.
 * - Development: verbose console output
 * - Production: minimal logging, ready for error tracking (Sentry etc.)
 */
export const logger = {
  /** Always logs errors (both dev and prod) — for critical failures */
  error(message: string, ...args: unknown[]) {
    console.error(message, ...args);
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (!isDevelopment) { Sentry.captureException(...) }
  },

  /** Logs warnings only in development */
  warn(message: string, ...args: unknown[]) {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },

  /** Logs info/debug details only in development */
  debug(message: string, ...args: unknown[]) {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  },

  /** Report an error from error boundaries */
  reportError(context: string, error: Error & { digest?: string }) {
    if (isDevelopment) {
      console.error(`[${context}]`, error);
    }
    // TODO: Send to error tracking service
    // Sentry.captureException(error, { tags: { context } });
  },
};
