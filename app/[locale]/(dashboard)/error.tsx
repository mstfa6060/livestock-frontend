"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/error/error-display";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Error:", error);
  }, [error]);

  return <ErrorDisplay error={error} reset={reset} showHomeButton showBackButton />;
}
