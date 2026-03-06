import * as Sentry from "@sentry/nextjs";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

/**
 * Environment-gated logger.
 * - Development: verbose console output
 * - Production: errors sent to Sentry
 */
export const logger = {
  /** Always logs errors (both dev and prod) — for critical failures */
  error(message: string, ...args: unknown[]) {
    console.error(message, ...args);
    if (!isDevelopment) {
      const error = args.find((a) => a instanceof Error);
      if (error) {
        Sentry.captureException(error, { extra: { message } });
      } else {
        Sentry.captureMessage(message, { level: "error", extra: { args } });
      }
    }
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
    Sentry.captureException(error, { tags: { context } });
  },
};
