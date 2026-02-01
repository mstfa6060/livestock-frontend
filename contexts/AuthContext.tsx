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
import { IAMAPI } from "@/api/base_modules/iam";
import { useFavoritesStore } from "@/stores/useFavoritesStore";

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

// Context type
interface AuthContextType extends AuthState {
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  JWT: "jwt",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  REMEMBERED_EMAIL: "rememberedEmail",
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const jwt = localStorage.getItem(STORAGE_KEYS.JWT);

        if (storedUser && jwt) {
          const user = JSON.parse(storedUser) as User;
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
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
  }, []);

  // Clear favorites when user logs out
  useEffect(() => {
    if (!state.isAuthenticated) {
      useFavoritesStore.getState().clearFavorites();
    }
    // Note: Favorites are now loaded lazily (on first use) instead of eagerly on login
    // This prevents 401 errors from blocking the login flow
  }, [state.isAuthenticated]);

  const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEYS.JWT);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

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
      localStorage.setItem('accessToken', response.jwt); // Also save as accessToken
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

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
    } catch {
      // Ignore logout errors - we'll clear local state anyway
    }

    clearAuthData();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    router.push("/login");
  }, [router]);

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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
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
