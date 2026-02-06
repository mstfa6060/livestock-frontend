"use client";

import { useEffect } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { ErrorDisplay } from "@/components/error/error-display";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Main Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />
      <main className="flex-1 flex items-center justify-center">
        <ErrorDisplay error={error} reset={reset} showHomeButton />
      </main>
      <SimpleFooter />
    </div>
  );
}
