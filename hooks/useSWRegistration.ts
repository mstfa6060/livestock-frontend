"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * Register and manage the service worker lifecycle.
 *
 * - Registers /sw.js on mount (production only).
 * - Checks for updates periodically (every 60 minutes).
 * - Prompts the new worker to activate immediately when an update is found.
 * - Listens for online/offline events and exposes connection state if needed.
 */
export function useSWRegistration() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const checkForUpdate = useCallback(() => {
    registrationRef.current?.update().catch(() => {
      // Silent fail - network may be unavailable
    });
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    let updateInterval: ReturnType<typeof setInterval> | null = null;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registrationRef.current = registration;

        // When a new SW is waiting, tell it to skip waiting
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available - activate it immediately
              newWorker.postMessage("skipWaiting");
            }
          });
        });

        // Check for updates every 60 minutes
        updateInterval = setInterval(checkForUpdate, 60 * 60 * 1000);
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });

    // When the new SW takes over, reload to get fresh assets
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      if (updateInterval) clearInterval(updateInterval);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, [checkForUpdate]);
}
