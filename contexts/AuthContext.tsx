"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { IAMAPI } from "@/api/base_modules/iam";
import { queryKeys } from "@/lib/query-keys";
import { isTokenExpired } from "@/lib/auth";

// User type from API
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  isPhoneVerified: boolean;
  countryId: number;
  countryCode: string;
  countryName: string;
  language: string;
  currencyCode: string;
  currencySymbol: string;
}

// Auth state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Login params
interface LoginParams {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Register params
interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  surname: string;
  phoneNumber: string;
  countryId: number;
  language: string;
  preferredCurrencyCode: string;
}

// Social login params
interface SocialLoginParams {
  provider: "google" | "apple";
  token: string;
  externalUserId: string;
  firstName?: string;
  surname?: string;
  email?: string;
}

// Context type
interface AuthContextType extends AuthState {
  login: (params: LoginParams) => Promise<void>;
  loginWithSocial: (params: SocialLoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserData: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  JWT: "jwt",
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  REMEMBERED_EMAIL: "rememberedEmail",
} as const;

const AUTH_COOKIE_NAME = "auth-token";

// Set a cookie flag so Next.js middleware can detect auth state
function setAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

// Remove the auth cookie
function removeAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Helper to clear auth data from localStorage and cookie
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.JWT);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    removeAuthCookie();
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const jwt = localStorage.getItem(STORAGE_KEYS.JWT);

        if (storedUser && jwt) {
          // Check if JWT is expired
          if (isTokenExpired(jwt)) {
            // Token expired, clear auth data
            clearAuthData();
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          const user = JSON.parse(storedUser) as User;
          setAuthCookie();
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          removeAuthCookie();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch {
        // Clear invalid data
        clearAuthData();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, [clearAuthData]);

  // Clear favorites + notifications cache when user logs out
  useEffect(() => {
    if (!state.isAuthenticated) {
      queryClient.removeQueries({ queryKey: queryKeys.favorites.all });
      queryClient.removeQueries({ queryKey: queryKeys.notifications.all });
    }
  }, [state.isAuthenticated, queryClient]);

  const login = useCallback(
    async ({ email, password, rememberMe }: LoginParams) => {
      const response = await IAMAPI.Auth.Login.Request({
        provider: "native",
        userName: email,
        password: password,
        token: "",
        platform: IAMAPI.Enums.ClientPlatforms.Web,
        firstName: "",
        surname: "",
        phoneNumber: "",
        externalProviderUserId: "",
      });

      // Store tokens
      localStorage.setItem(STORAGE_KEYS.JWT, response.jwt);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.jwt); // Also save as accessToken
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      setAuthCookie();

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBERED_EMAIL, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBERED_EMAIL);
      }

      // Update state
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      router.push("/dashboard");
    },
    [router]
  );

  const loginWithSocial = useCallback(
    async ({ provider, token, externalUserId, firstName, surname, email }: SocialLoginParams) => {
      const response = await IAMAPI.Auth.Login.Request({
        provider: provider,
        userName: email || "",
        password: "",
        token: token,
        platform: IAMAPI.Enums.ClientPlatforms.Web,
        firstName: firstName || "",
        surname: surname || "",
        phoneNumber: "",
        externalProviderUserId: externalUserId,
        email: email || "",
      });

      // Store tokens
      localStorage.setItem(STORAGE_KEYS.JWT, response.jwt);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.jwt);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      setAuthCookie();

      // Update state
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      router.push("/dashboard");
    },
    [router]
  );

  const register = useCallback(
    async (params: RegisterParams) => {
      await IAMAPI.Users.Create.Request({
        userName: params.email,
        firstName: params.firstName,
        surname: params.surname,
        email: params.email,
        password: params.password,
        providerId: "",
        userSource: IAMAPI.Enums.UserSources.Manual,
        description: "",
        phoneNumber: params.phoneNumber,
        countryId: params.countryId,
        language: params.language,
        preferredCurrencyCode: params.preferredCurrencyCode,
      });

      // After registration, login automatically
      await login({
        email: params.email,
        password: params.password,
      });
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await IAMAPI.Auth.Logout.Request({});
    } catch (error) {
      console.warn("Logout API call failed, clearing local session:", error);
    }

    clearAuthData();
    queryClient.clear();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    router.push("/login");
  }, [router, clearAuthData, queryClient]);

  const refreshUser = useCallback(async () => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser) as User;
      const response = await IAMAPI.Users.Detail.Request({
        userId: user.id,
      });

      const updatedUser: User = {
        ...user,
        username: response.userName,
        email: response.email,
        displayName: response.fullName,
        isPhoneVerified: response.isPhoneVerified,
        language: response.language || user.language,
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    } catch {
      // If user detail fails, keep existing data
    }
  }, []);

  // Refresh session by using refresh token to get new JWT (e.g., after role change)
  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return;

    try {
      const response = await IAMAPI.Auth.RefreshToken.Request({
        refreshToken,
        platform: IAMAPI.Enums.ClientPlatforms.Web,
      });

      localStorage.setItem(STORAGE_KEYS.JWT, response.jwt);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.jwt);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      setAuthCookie();

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // If refresh fails, keep existing session
    }
  }, []);

  // Update user state directly (used after profile update with full response)
  const updateUserData = useCallback((data: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...data };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginWithSocial,
        register,
        logout,
        refreshUser,
        refreshSession,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Get remembered email (for login page)
export function getRememberedEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.REMEMBERED_EMAIL);
}
