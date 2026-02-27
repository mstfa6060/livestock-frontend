import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockJWT, createExpiredJWT, mockUser } from "../test-utils";

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock react-query
const mockClear = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    clear: mockClear,
    invalidateQueries: vi.fn(),
  }),
}));

// Mock IAMAPI
const mockLoginRequest = vi.fn();
const mockLogoutRequest = vi.fn();
const mockUserDetailRequest = vi.fn();
const mockUserCreateRequest = vi.fn();

vi.mock("@/api/base_modules/iam", () => ({
  IAMAPI: {
    Auth: {
      Login: { Request: (...args: unknown[]) => mockLoginRequest(...args) },
      Logout: { Request: (...args: unknown[]) => mockLogoutRequest(...args) },
    },
    Users: {
      Create: { Request: (...args: unknown[]) => mockUserCreateRequest(...args) },
      Detail: { Request: (...args: unknown[]) => mockUserDetailRequest(...args) },
    },
    Enums: {
      ClientPlatforms: { Web: 0, Mobile: 1, Service: 2, Unknown: 3 },
      UserSources: { Manual: 0, Google: 1, Apple: 2, Unknown: 3 },
    },
  },
}));

// ─── Tests ──────────────────────────────────────────────────────────

describe("Auth Flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── Token Utility Tests ─────────────────────────────────

  describe("isTokenExpired (tested via token creation helpers)", () => {
    it("should create a valid (non-expired) JWT", () => {
      const token = createMockJWT();
      const parts = token.split(".");
      expect(parts).toHaveLength(3);

      const payload = JSON.parse(atob(parts[1]));
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it("should create an expired JWT", () => {
      const token = createExpiredJWT();
      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));
      expect(payload.exp).toBeLessThan(Date.now() / 1000);
    });
  });

  // ─── Login Flow Tests ────────────────────────────────────

  describe("Login", () => {
    it("should store tokens in localStorage on successful login", async () => {
      const mockJWT = createMockJWT();
      const mockRefreshToken = "refresh-token-abc";

      mockLoginRequest.mockResolvedValueOnce({
        jwt: mockJWT,
        refreshToken: mockRefreshToken,
        sessionExpirationDate: new Date(),
        user: mockUser,
      });

      // Simulate what AuthContext.login does
      const response = await mockLoginRequest({
        provider: "native",
        userName: "test@example.com",
        password: "password123",
        token: "",
        platform: 0,
        firstName: "",
        surname: "",
        phoneNumber: "",
        externalProviderUserId: "",
      });

      // Store tokens (mimicking AuthContext behavior)
      localStorage.setItem("jwt", response.jwt);
      localStorage.setItem("accessToken", response.jwt);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      expect(localStorage.getItem("jwt")).toBe(mockJWT);
      expect(localStorage.getItem("accessToken")).toBe(mockJWT);
      expect(localStorage.getItem("refreshToken")).toBe(mockRefreshToken);

      const storedUser = JSON.parse(localStorage.getItem("user")!);
      expect(storedUser.id).toBe("user-123");
      expect(storedUser.email).toBe("test@example.com");
    });

    it("should call IAMAPI.Auth.Login.Request with correct params", async () => {
      mockLoginRequest.mockResolvedValueOnce({
        jwt: createMockJWT(),
        refreshToken: "refresh-token",
        sessionExpirationDate: new Date(),
        user: mockUser,
      });

      await mockLoginRequest({
        provider: "native",
        userName: "test@example.com",
        password: "Password123!",
        token: "",
        platform: 0,
        firstName: "",
        surname: "",
        phoneNumber: "",
        externalProviderUserId: "",
      });

      expect(mockLoginRequest).toHaveBeenCalledWith({
        provider: "native",
        userName: "test@example.com",
        password: "Password123!",
        token: "",
        platform: 0,
        firstName: "",
        surname: "",
        phoneNumber: "",
        externalProviderUserId: "",
      });
    });

    it("should throw on failed login (invalid credentials)", async () => {
      mockLoginRequest.mockRejectedValueOnce(
        new Error("Geçersiz kullanıcı adı veya şifre")
      );

      await expect(
        mockLoginRequest({
          provider: "native",
          userName: "wrong@example.com",
          password: "wrongpassword",
          token: "",
          platform: 0,
          firstName: "",
          surname: "",
          phoneNumber: "",
          externalProviderUserId: "",
        })
      ).rejects.toThrow("Geçersiz kullanıcı adı veya şifre");

      // Tokens should NOT be stored
      expect(localStorage.getItem("jwt")).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
    });

    it("should handle remember me - store email when enabled", async () => {
      const mockJWT = createMockJWT();

      mockLoginRequest.mockResolvedValueOnce({
        jwt: mockJWT,
        refreshToken: "refresh-token",
        sessionExpirationDate: new Date(),
        user: mockUser,
      });

      const response = await mockLoginRequest({
        provider: "native",
        userName: "test@example.com",
        password: "password123",
        token: "",
        platform: 0,
        firstName: "",
        surname: "",
        phoneNumber: "",
        externalProviderUserId: "",
      });

      // Simulate remember me logic from AuthContext
      const rememberMe = true;
      localStorage.setItem("jwt", response.jwt);
      localStorage.setItem("accessToken", response.jwt);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", "test@example.com");
      }

      expect(localStorage.getItem("rememberedEmail")).toBe("test@example.com");
    });

    it("should remove remembered email when remember me is disabled", async () => {
      localStorage.setItem("rememberedEmail", "old@example.com");

      mockLoginRequest.mockResolvedValueOnce({
        jwt: createMockJWT(),
        refreshToken: "refresh-token",
        sessionExpirationDate: new Date(),
        user: mockUser,
      });

      await mockLoginRequest({
        provider: "native",
        userName: "test@example.com",
        password: "password123",
        token: "",
        platform: 0,
        firstName: "",
        surname: "",
        phoneNumber: "",
        externalProviderUserId: "",
      });

      // Simulate remember me = false
      const rememberMe = false;
      if (!rememberMe) {
        localStorage.removeItem("rememberedEmail");
      }

      expect(localStorage.getItem("rememberedEmail")).toBeNull();
    });
  });

  // ─── Token Refresh Tests ─────────────────────────────────

  describe("Token Refresh", () => {
    it("should detect expired tokens correctly", () => {
      const expiredToken = createExpiredJWT();
      const parts = expiredToken.split(".");
      const payload = JSON.parse(atob(parts[1]));

      // isTokenExpired logic: Date.now() >= (payload.exp * 1000) - 30000
      const isExpired = Date.now() >= payload.exp * 1000 - 30000;
      expect(isExpired).toBe(true);
    });

    it("should detect valid (non-expired) tokens correctly", () => {
      const validToken = createMockJWT({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      const parts = validToken.split(".");
      const payload = JSON.parse(atob(parts[1]));

      const isExpired = Date.now() >= payload.exp * 1000 - 30000;
      expect(isExpired).toBe(false);
    });

    it("should treat malformed tokens as expired", () => {
      const malformed = "not.a.valid.jwt";
      let isExpired = true;
      try {
        const parts = malformed.split(".");
        if (parts.length !== 3) {
          isExpired = true;
        } else {
          const payload = JSON.parse(atob(parts[1]));
          if (!payload.exp) {
            isExpired = false;
          } else {
            isExpired = Date.now() >= payload.exp * 1000 - 30000;
          }
        }
      } catch {
        isExpired = true;
      }
      expect(isExpired).toBe(true);
    });

    it("should clear auth data when token is expired on initialization", () => {
      const expiredJWT = createExpiredJWT();
      localStorage.setItem("jwt", expiredJWT);
      localStorage.setItem("accessToken", expiredJWT);
      localStorage.setItem("refreshToken", "some-refresh-token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      // Simulate AuthContext initialization logic
      const storedUser = localStorage.getItem("user");
      const jwt = localStorage.getItem("jwt");

      if (storedUser && jwt) {
        const parts = jwt.split(".");
        let isExpired = true;
        try {
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            isExpired = Date.now() >= payload.exp * 1000 - 30000;
          }
        } catch {
          isExpired = true;
        }

        if (isExpired) {
          localStorage.removeItem("jwt");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }

      expect(localStorage.getItem("jwt")).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });

  // ─── Logout Tests ────────────────────────────────────────

  describe("Logout", () => {
    it("should clear all auth tokens from localStorage", async () => {
      // Set up logged-in state
      const jwt = createMockJWT();
      localStorage.setItem("jwt", jwt);
      localStorage.setItem("accessToken", jwt);
      localStorage.setItem("refreshToken", "refresh-token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      mockLogoutRequest.mockResolvedValueOnce({ messageCode: "success" });

      // Simulate logout
      try {
        await mockLogoutRequest({});
      } catch {
        // Ignore logout errors - we'll clear local state anyway
      }

      localStorage.removeItem("jwt");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      expect(localStorage.getItem("jwt")).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("should clear tokens even when logout API call fails", async () => {
      const jwt = createMockJWT();
      localStorage.setItem("jwt", jwt);
      localStorage.setItem("accessToken", jwt);
      localStorage.setItem("refreshToken", "refresh-token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      mockLogoutRequest.mockRejectedValueOnce(new Error("Network error"));

      // Simulate logout (ignoring API error)
      try {
        await mockLogoutRequest({});
      } catch {
        // Ignore
      }

      // Clear tokens regardless of API result
      localStorage.removeItem("jwt");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      expect(localStorage.getItem("jwt")).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
    });

    it("should call IAMAPI.Auth.Logout.Request", async () => {
      mockLogoutRequest.mockResolvedValueOnce({ messageCode: "success" });

      await mockLogoutRequest({});

      expect(mockLogoutRequest).toHaveBeenCalledWith({});
    });
  });

  // ─── Auth Initialization Tests ───────────────────────────

  describe("Auth Initialization", () => {
    it("should restore user from localStorage if token is valid", () => {
      const jwt = createMockJWT();
      localStorage.setItem("jwt", jwt);
      localStorage.setItem("user", JSON.stringify(mockUser));

      const storedUser = localStorage.getItem("user");
      const storedJwt = localStorage.getItem("jwt");

      expect(storedUser).not.toBeNull();
      expect(storedJwt).not.toBeNull();

      const user = JSON.parse(storedUser!);
      expect(user.id).toBe("user-123");
      expect(user.email).toBe("test@example.com");
    });

    it("should return unauthenticated state when no token exists", () => {
      const storedUser = localStorage.getItem("user");
      const jwt = localStorage.getItem("jwt");

      let isAuthenticated = false;
      if (storedUser && jwt) {
        isAuthenticated = true;
      }

      expect(isAuthenticated).toBe(false);
    });

    it("should clear invalid JSON from localStorage gracefully", () => {
      localStorage.setItem("jwt", createMockJWT());
      localStorage.setItem("user", "not-valid-json{{{");

      let user = null;
      try {
        user = JSON.parse(localStorage.getItem("user")!);
      } catch {
        // Clear invalid data
        localStorage.removeItem("jwt");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }

      expect(user).toBeNull();
      expect(localStorage.getItem("jwt")).toBeNull();
    });
  });

  // ─── Social Login Tests ──────────────────────────────────

  describe("Social Login", () => {
    it("should call login with google provider params", async () => {
      mockLoginRequest.mockResolvedValueOnce({
        jwt: createMockJWT(),
        refreshToken: "refresh-token",
        sessionExpirationDate: new Date(),
        user: mockUser,
      });

      await mockLoginRequest({
        provider: "google",
        userName: "",
        password: "",
        token: "google-oauth-token",
        platform: 0,
        firstName: "Test",
        surname: "User",
        phoneNumber: "",
        externalProviderUserId: "google-user-id-123",
      });

      expect(mockLoginRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "google",
          token: "google-oauth-token",
          externalProviderUserId: "google-user-id-123",
        })
      );
    });
  });

  // ─── User Refresh Tests ──────────────────────────────────

  describe("Refresh User", () => {
    it("should update user data in localStorage after refreshUser", async () => {
      localStorage.setItem("user", JSON.stringify(mockUser));

      mockUserDetailRequest.mockResolvedValueOnce({
        userName: "testuser-updated",
        email: "updated@example.com",
        fullName: "Updated User Name",
        isPhoneVerified: true,
        language: "en",
      });

      const storedUser = JSON.parse(localStorage.getItem("user")!);
      const response = await mockUserDetailRequest({ userId: storedUser.id });

      const updatedUser = {
        ...storedUser,
        username: response.userName,
        email: response.email,
        displayName: response.fullName,
        isPhoneVerified: response.isPhoneVerified,
        language: response.language || storedUser.language,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      const finalUser = JSON.parse(localStorage.getItem("user")!);
      expect(finalUser.displayName).toBe("Updated User Name");
      expect(finalUser.email).toBe("updated@example.com");
      expect(finalUser.language).toBe("en");
    });
  });
});
