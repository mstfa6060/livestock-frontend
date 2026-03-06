import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NEXT_PUBLIC_ENVIRONMENT === "development" ? 1.0 : 0.2,

  // Only send errors in production
  enabled: process.env.NEXT_PUBLIC_ENVIRONMENT !== "development",
});
