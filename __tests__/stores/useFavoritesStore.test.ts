import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockFavoritesAllRequest = vi.fn();
const mockFavoritesCreateRequest = vi.fn();
const mockFavoritesDeleteRequest = vi.fn();

vi.mock("@/api/business_modules/livestocktrading", () => ({
  LivestockTradingAPI: {
    FavoriteProducts: {
      All: { Request: (...args: unknown[]) => mockFavoritesAllRequest(...args) },
      Create: { Request: (...args: unknown[]) => mockFavoritesCreateRequest(...args) },
      Delete: { Request: (...args: unknown[]) => mockFavoritesDeleteRequest(...args) },
    },
    Enums: {
      XSortingDirection: { Ascending: 0, Descending: 1 },
    },
  },
}));

// Import after mocks
import { useFavoritesStore } from "@/stores/useFavoritesStore";

// ─── Tests ──────────────────────────────────────────────────────────

describe("useFavoritesStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useFavoritesStore.setState({
      favoriteMap: new Map<string, string>(),
      isLoading: false,
      isInitialized: false,
    });
    vi.clearAllMocks();
  });

  // ─── Initial State ──────────────────────────────────────

  describe("Initial State", () => {
    it("should have empty favoriteMap initially", () => {
      const state = useFavoritesStore.getState();
      expect(state.favoriteMap.size).toBe(0);
    });

    it("should not be loading initially", () => {
      const state = useFavoritesStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it("should not be initialized initially", () => {
      const state = useFavoritesStore.getState();
      expect(state.isInitialized).toBe(false);
    });
  });

  // ─── Initialize ─────────────────────────────────────────

  describe("initialize", () => {
    it("should fetch all favorites and build the map", async () => {
      mockFavoritesAllRequest.mockResolvedValueOnce([
        { id: "fav-1", productId: "product-1" },
        { id: "fav-2", productId: "product-2" },
        { id: "fav-3", productId: "product-3" },
      ]);

      await useFavoritesStore.getState().initialize("user-123");

      const state = useFavoritesStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.favoriteMap.size).toBe(3);
      expect(state.favoriteMap.get("product-1")).toBe("fav-1");
      expect(state.favoriteMap.get("product-2")).toBe("fav-2");
      expect(state.favoriteMap.get("product-3")).toBe("fav-3");
    });

    it("should skip initialization if already initialized", async () => {
      mockFavoritesAllRequest.mockResolvedValueOnce([
        { id: "fav-1", productId: "product-1" },
      ]);

      await useFavoritesStore.getState().initialize("user-123");
      await useFavoritesStore.getState().initialize("user-123");

      // Should only call API once
      expect(mockFavoritesAllRequest).toHaveBeenCalledTimes(1);
    });

    it("should reinitialize when force=true", async () => {
      mockFavoritesAllRequest
        .mockResolvedValueOnce([{ id: "fav-1", productId: "product-1" }])
        .mockResolvedValueOnce([
          { id: "fav-1", productId: "product-1" },
          { id: "fav-2", productId: "product-2" },
        ]);

      await useFavoritesStore.getState().initialize("user-123");
      await useFavoritesStore.getState().initialize("user-123", true);

      expect(mockFavoritesAllRequest).toHaveBeenCalledTimes(2);
      expect(useFavoritesStore.getState().favoriteMap.size).toBe(2);
    });

    it("should mark as initialized even when API fails", async () => {
      mockFavoritesAllRequest.mockRejectedValueOnce(new Error("Network error"));

      await useFavoritesStore.getState().initialize("user-123");

      const state = useFavoritesStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.favoriteMap.size).toBe(0);
    });

    it("should not reinitialize while currently loading", async () => {
      // Set loading state manually
      useFavoritesStore.setState({ isLoading: true });

      mockFavoritesAllRequest.mockResolvedValueOnce([]);

      await useFavoritesStore.getState().initialize("user-123");

      // Should not have called the API since isLoading was true
      expect(mockFavoritesAllRequest).not.toHaveBeenCalled();
    });
  });

  // ─── isFavorite ─────────────────────────────────────────

  describe("isFavorite", () => {
    it("should return true for a favorited product", () => {
      useFavoritesStore.setState({
        favoriteMap: new Map([["product-1", "fav-1"]]),
        isInitialized: true,
      });

      expect(useFavoritesStore.getState().isFavorite("product-1")).toBe(true);
    });

    it("should return false for a non-favorited product", () => {
      useFavoritesStore.setState({
        favoriteMap: new Map([["product-1", "fav-1"]]),
        isInitialized: true,
      });

      expect(useFavoritesStore.getState().isFavorite("product-99")).toBe(false);
    });

    it("should return false when store is empty", () => {
      expect(useFavoritesStore.getState().isFavorite("any-product")).toBe(false);
    });
  });

  // ─── toggleFavorite ─────────────────────────────────────

  describe("toggleFavorite", () => {
    it("should add a product to favorites (returns true)", async () => {
      useFavoritesStore.setState({
        favoriteMap: new Map<string, string>(),
        isInitialized: true,
      });

      mockFavoritesCreateRequest.mockResolvedValueOnce({
        id: "new-fav-id",
      });

      const result = await useFavoritesStore
        .getState()
        .toggleFavorite("product-1", "user-123");

      expect(result).toBe(true);
      expect(useFavoritesStore.getState().favoriteMap.has("product-1")).toBe(
        true
      );
      expect(useFavoritesStore.getState().favoriteMap.get("product-1")).toBe(
        "new-fav-id"
      );
    });

    it("should remove a product from favorites (returns false)", async () => {
      useFavoritesStore.setState({
        favoriteMap: new Map([["product-1", "fav-1"]]),
        isInitialized: true,
      });

      mockFavoritesDeleteRequest.mockResolvedValueOnce({});

      const result = await useFavoritesStore
        .getState()
        .toggleFavorite("product-1", "user-123");

      expect(result).toBe(false);
      expect(useFavoritesStore.getState().favoriteMap.has("product-1")).toBe(
        false
      );
    });

    it("should optimistically update the map when adding", async () => {
      useFavoritesStore.setState({
        favoriteMap: new Map<string, string>(),
        isInitialized: true,
      });

      // Make the create request never resolve (to test optimistic state)
      let resolveCreate: (val: { id: string }) => void;
      mockFavoritesCreateRequest.mockReturnValueOnce(
        new Promise<{ id: string }>((resolve) => {
          resolveCreate = resolve;
        })
      );

      const togglePromise = useFavoritesStore
        .getState()
        .toggleFavorite("product-1", "user-123");

      // Optimistic: should have 'pending' as the value
      expect(useFavoritesStore.getState().favoriteMap.has("product-1")).toBe(
        true
      );
      expect(useFavoritesStore.getState().favoriteMap.get("product-1")).toBe(
        "pending"
      );

      // Resolve the create request
      resolveCreate!({ id: "real-fav-id" });
      await togglePromise;

      // Should now have the real ID
      expect(useFavoritesStore.getState().favoriteMap.get("product-1")).toBe(
        "real-fav-id"
      );
    });

    it("should revert optimistic update on error when adding", async () => {
      useFavoritesStore.setState({
        favoriteMap: new Map<string, string>(),
        isInitialized: true,
      });

      mockFavoritesCreateRequest.mockRejectedValueOnce(
        new Error("Server error")
      );

      await expect(
        useFavoritesStore.getState().toggleFavorite("product-1", "user-123")
      ).rejects.toThrow("Server error");

      // Should be reverted
      expect(useFavoritesStore.getState().favoriteMap.has("product-1")).toBe(
        false
      );
    });

    it("should revert optimistic update on error when removing", async () => {
      useFavoritesStore.setState({
        favoriteMap: new Map([["product-1", "fav-1"]]),
        isInitialized: true,
      });

      mockFavoritesDeleteRequest.mockRejectedValueOnce(
        new Error("Server error")
      );

      await expect(
        useFavoritesStore.getState().toggleFavorite("product-1", "user-123")
      ).rejects.toThrow("Server error");

      // Should be reverted back to having the favorite
      expect(useFavoritesStore.getState().favoriteMap.has("product-1")).toBe(
        true
      );
      expect(useFavoritesStore.getState().favoriteMap.get("product-1")).toBe(
        "fav-1"
      );
    });

    it("should lazily initialize when not yet initialized", async () => {
      // Not initialized
      useFavoritesStore.setState({
        favoriteMap: new Map<string, string>(),
        isInitialized: false,
      });

      // Mock the initialize call
      mockFavoritesAllRequest.mockResolvedValueOnce([]);
      mockFavoritesCreateRequest.mockResolvedValueOnce({ id: "new-fav" });

      await useFavoritesStore
        .getState()
        .toggleFavorite("product-1", "user-123");

      expect(mockFavoritesAllRequest).toHaveBeenCalled();
    });
  });

  // ─── clearFavorites ─────────────────────────────────────

  describe("clearFavorites", () => {
    it("should clear all favorites and reset initialization", () => {
      useFavoritesStore.setState({
        favoriteMap: new Map([
          ["product-1", "fav-1"],
          ["product-2", "fav-2"],
        ]),
        isInitialized: true,
      });

      useFavoritesStore.getState().clearFavorites();

      const state = useFavoritesStore.getState();
      expect(state.favoriteMap.size).toBe(0);
      expect(state.isInitialized).toBe(false);
    });
  });
});
