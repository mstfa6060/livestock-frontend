"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/error/error-display";
import { logger } from "@/lib/logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.reportError("DashboardError", error);
  }, [error]);

  return <ErrorDisplay error={error} reset={reset} showHomeButton showBackButton />;
}
