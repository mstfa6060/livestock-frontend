import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────

let mockUnreadCountRequest = vi.fn();

vi.mock("@/api/business_modules/livestocktrading", () => ({
  LivestockTradingAPI: {
    Messages: {
      UnreadCount: { Request: (...args: unknown[]) => mockUnreadCountRequest(...args) },
    },
  },
}));

import { useMessagesStore } from "@/stores/useMessagesStore";

// ─── Tests ──────────────────────────────────────────────────────────

describe("useMessagesStore", () => {
  beforeEach(() => {
    useMessagesStore.setState({
      unreadCount: 0,
      isLoading: false,
      lastFetched: null,
    });
    mockUnreadCountRequest = vi.fn();
    vi.resetAllMocks();
  });

  // ─── Initial State ──────────────────────────────────────

  describe("Initial State", () => {
    it("should have zero unread count initially", () => {
      const state = useMessagesStore.getState();
      expect(state.unreadCount).toBe(0);
    });

    it("should not be loading initially", () => {
      const state = useMessagesStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it("should have null lastFetched initially", () => {
      const state = useMessagesStore.getState();
      expect(state.lastFetched).toBeNull();
    });
  });

  // ─── fetchUnreadCount ───────────────────────────────────

  describe("fetchUnreadCount", () => {
    it("should fetch and store unread count", async () => {
      mockUnreadCountRequest.mockResolvedValueOnce({
        totalUnreadCount: 5,
      });

      await useMessagesStore.getState().fetchUnreadCount("user-123");

      const state = useMessagesStore.getState();
      expect(state.unreadCount).toBe(5);
      expect(state.isLoading).toBe(false);
      expect(state.lastFetched).not.toBeNull();
    });

    it("should use cache within CACHE_DURATION (2 minutes)", async () => {
      mockUnreadCountRequest.mockResolvedValue({ totalUnreadCount: 5 });

      await useMessagesStore.getState().fetchUnreadCount("user-123");
      await useMessagesStore.getState().fetchUnreadCount("user-123");

      // Only called once due to cache
      expect(mockUnreadCountRequest).toHaveBeenCalledTimes(1);
    });

    it("should bypass cache when force=true", async () => {
      mockUnreadCountRequest.mockResolvedValue({ totalUnreadCount: 5 });

      await useMessagesStore.getState().fetchUnreadCount("user-123");
      await useMessagesStore.getState().fetchUnreadCount("user-123", true);

      expect(mockUnreadCountRequest).toHaveBeenCalledTimes(2);
    });

    it("should prevent concurrent fetches", async () => {
      useMessagesStore.setState({ isLoading: true });

      mockUnreadCountRequest.mockResolvedValueOnce({ totalUnreadCount: 5 });

      await useMessagesStore.getState().fetchUnreadCount("user-123");

      expect(mockUnreadCountRequest).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully (no crash)", async () => {
      mockUnreadCountRequest.mockRejectedValueOnce(new Error("Network error"));

      await useMessagesStore.getState().fetchUnreadCount("user-123");

      const state = useMessagesStore.getState();
      expect(state.isLoading).toBe(false);
      // unreadCount remains at 0 on error
      expect(state.unreadCount).toBe(0);
    });

    it("should call API with userId", async () => {
      mockUnreadCountRequest.mockResolvedValueOnce({ totalUnreadCount: 3 });

      await useMessagesStore.getState().fetchUnreadCount("user-456");

      expect(mockUnreadCountRequest).toHaveBeenCalledWith({
        userId: "user-456",
      });
    });
  });

  // ─── clearMessages ──────────────────────────────────────

  describe("clearMessages", () => {
    it("should clear unread count and reset lastFetched", () => {
      useMessagesStore.setState({
        unreadCount: 10,
        lastFetched: Date.now(),
      });

      useMessagesStore.getState().clearMessages();

      const state = useMessagesStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.lastFetched).toBeNull();
    });
  });
});
