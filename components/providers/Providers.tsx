"use client";

import { ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { makeQueryClient } from "@/lib/query-client";
import { useSWRegistration } from "@/hooks/useSWRegistration";
import dynamic from "next/dynamic";

const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((mod) => mod.ReactQueryDevtools),
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * Add all client-side context providers here
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient());

  useSWRegistration();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
