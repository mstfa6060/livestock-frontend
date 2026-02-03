"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";

interface CapturedError {
  timestamp: string;
  type: "error" | "warn" | "api";
  message: string;
  stack?: string;
  url?: string;
}

const MAX_ERRORS = 50;
const STORAGE_KEY = "debug_captured_errors";

// Get errors from localStorage
const getErrors = (): CapturedError[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save error to localStorage
const saveError = (error: CapturedError) => {
  if (typeof window === "undefined") return;
  try {
    const errors = getErrors();
    errors.unshift(error);
    // Keep only last MAX_ERRORS
    if (errors.length > MAX_ERRORS) {
      errors.splice(MAX_ERRORS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
  } catch {
    // Ignore storage errors
  }
};

// Clear all errors
const clearErrors = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
};

// Format errors for clipboard
const formatErrorsForClipboard = (): string => {
  const errors = getErrors();
  if (errors.length === 0) {
    return "No errors captured.";
  }

  const lines = [
    "=== Browser Debug Log ===",
    `Captured at: ${new Date().toISOString()}`,
    `URL: ${window.location.href}`,
    `User Agent: ${navigator.userAgent}`,
    `Total Errors: ${errors.length}`,
    "",
    "=== Errors ===",
    "",
  ];

  errors.forEach((error, index) => {
    lines.push(`[${index + 1}] ${error.timestamp} [${error.type.toUpperCase()}]`);
    lines.push(`Message: ${error.message}`);
    if (error.url) {
      lines.push(`URL: ${error.url}`);
    }
    if (error.stack) {
      lines.push(`Stack: ${error.stack}`);
    }
    lines.push("");
  });

  return lines.join("\n");
};

export function ErrorCapture() {
  // Copy errors to clipboard
  const copyErrorsToClipboard = useCallback(async () => {
    const text = formatErrorsForClipboard();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Debug log copied to clipboard!", {
        description: `${getErrors().length} errors captured`,
      });
    } catch {
      // Fallback: create textarea and copy
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Debug log copied to clipboard!");
    }
  }, []);

  // Clear errors
  const handleClearErrors = useCallback(() => {
    clearErrors();
    toast.info("Debug log cleared");
  }, []);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== "development") return;

    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error
    console.error = (...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");

      saveError({
        timestamp: new Date().toISOString(),
        type: "error",
        message,
        stack: new Error().stack,
        url: window.location.href,
      });

      originalError.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");

      saveError({
        timestamp: new Date().toISOString(),
        type: "warn",
        message,
        url: window.location.href,
      });

      originalWarn.apply(console, args);
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      saveError({
        timestamp: new Date().toISOString(),
        type: "error",
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
      });
    };

    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason);
      const stack =
        event.reason instanceof Error ? event.reason.stack : undefined;

      saveError({
        timestamp: new Date().toISOString(),
        type: "error",
        message: `Unhandled Promise Rejection: ${message}`,
        stack,
        url: window.location.href,
      });
    };

    // Keyboard shortcut: Ctrl+Shift+E to copy, Ctrl+Shift+D to clear
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        if (event.key === "E" || event.key === "e") {
          event.preventDefault();
          copyErrorsToClipboard();
        } else if (event.key === "D" || event.key === "d") {
          event.preventDefault();
          handleClearErrors();
        }
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("keydown", handleKeyDown);

    // Log instructions on mount
    console.log(
      "%c🐛 Debug Mode Active",
      "color: #10b981; font-weight: bold; font-size: 14px"
    );
    console.log(
      "%cCtrl+Shift+E → Copy errors to clipboard\nCtrl+Shift+D → Clear error log",
      "color: #6b7280; font-size: 12px"
    );

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [copyErrorsToClipboard, handleClearErrors]);

  return null;
}
