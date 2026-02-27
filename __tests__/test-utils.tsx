import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Creates a fresh QueryClient for each test to avoid shared state.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper that provides QueryClientProvider for testing hooks/components
 * that depend on React Query.
 */
export function createQueryWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

/**
 * Custom render that wraps components with all required providers.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const { Wrapper } = createQueryWrapper();
  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Helper to create a valid JWT token for testing.
 * Creates a base64-encoded JWT with configurable expiration.
 */
export function createMockJWT(options?: {
  exp?: number;
  sub?: string;
  email?: string;
}): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: options?.sub ?? "test-user-id",
      email: options?.email ?? "test@example.com",
      exp: options?.exp ?? Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
    })
  );
  const signature = btoa("mock-signature");
  return `${header}.${payload}.${signature}`;
}

/**
 * Helper to create an expired JWT token for testing.
 */
export function createExpiredJWT(): string {
  return createMockJWT({
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  });
}

/**
 * Mock user object matching the User interface from AuthContext.
 */
export const mockUser = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  isPhoneVerified: true,
  countryId: 1,
  countryCode: "TR",
  countryName: "Turkey",
  language: "tr",
  currencyCode: "TRY",
  currencySymbol: "₺",
};
