import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NEXT_PUBLIC_ENVIRONMENT === "development" ? 1.0 : 0.2,

  // Session replay (captures user interactions before an error)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Only send errors in production
  enabled: process.env.NEXT_PUBLIC_ENVIRONMENT !== "development",
});
