"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * Add all client-side context providers here
 */
export function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
