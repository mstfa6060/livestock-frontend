import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockNotificationsAllRequest = vi.fn();
const mockNotificationsUpdateRequest = vi.fn();

vi.mock("@/api/business_modules/livestocktrading", () => ({
  LivestockTradingAPI: {
    Notifications: {
      All: { Request: (...args: unknown[]) => mockNotificationsAllRequest(...args) },
      Update: { Request: (...args: unknown[]) => mockNotificationsUpdateRequest(...args) },
    },
    Enums: {
      XSortingDirection: { Ascending: 0, Descending: 1 },
    },
  },
}));

import { useNotificationsStore } from "@/stores/useNotificationsStore";

// ─── Test Data ──────────────────────────────────────────────────────

const mockNotifications = [
  {
    id: "notif-1",
    userId: "user-123",
    title: "New Offer",
    message: "You received a new offer",
    type: 1,
    isRead: false,
    sentAt: new Date("2026-02-27T10:00:00Z"),
    createdAt: new Date("2026-02-27T10:00:00Z"),
  },
  {
    id: "notif-2",
    userId: "user-123",
    title: "Price Drop",
    message: "A product you follow dropped in price",
    type: 2,
    isRead: false,
    sentAt: new Date("2026-02-27T09:00:00Z"),
    createdAt: new Date("2026-02-27T09:00:00Z"),
  },
  {
    id: "notif-3",
    userId: "user-123",
    title: "Welcome",
    message: "Welcome to the platform",
    type: 0,
    isRead: true,
    sentAt: new Date("2026-02-26T12:00:00Z"),
    createdAt: new Date("2026-02-26T12:00:00Z"),
  },
];

// ─── Tests ──────────────────────────────────────────────────────────

describe("useNotificationsStore", () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetched: null,
      retryCount: 0,
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Initial State ──────────────────────────────────────

  describe("Initial State", () => {
    it("should have empty notifications", () => {
      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeNull();
    });
  });

  // ─── fetchNotifications ─────────────────────────────────

  describe("fetchNotifications", () => {
    it("should fetch and store notifications", async () => {
      mockNotificationsAllRequest.mockResolvedValueOnce(mockNotifications);

      await useNotificationsStore.getState().fetchNotifications("user-123");

      const state = useNotificationsStore.getState();
      expect(state.notifications).toHaveLength(3);
      expect(state.unreadCount).toBe(2); // notif-1 and notif-2 are unread
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).not.toBeNull();
    });

    it("should use cache within CACHE_DURATION (2 minutes)", async () => {
      mockNotificationsAllRequest.mockResolvedValueOnce(mockNotifications);

      await useNotificationsStore.getState().fetchNotifications("user-123");

      // Try to fetch again without force
      await useNotificationsStore.getState().fetchNotifications("user-123");

      // Should only call API once (cached)
      expect(mockNotificationsAllRequest).toHaveBeenCalledTimes(1);
    });

    it("should bypass cache when force=true", async () => {
      mockNotificationsAllRequest.mockResolvedValue(mockNotifications);

      await useNotificationsStore.getState().fetchNotifications("user-123");
      await useNotificationsStore
        .getState()
        .fetchNotifications("user-123", true);

      expect(mockNotificationsAllRequest).toHaveBeenCalledTimes(2);
    });

    it("should handle API errors gracefully", async () => {
      mockNotificationsAllRequest.mockRejectedValueOnce(
        new Error("Network error")
      );

      await useNotificationsStore.getState().fetchNotifications("user-123");

      const state = useNotificationsStore.getState();
      expect(state.error).toBe("Network error");
      expect(state.isLoading).toBe(false);
      expect(state.retryCount).toBe(1);
    });

    it("should prevent concurrent fetches", async () => {
      // Set isLoading to simulate concurrent fetch
      useNotificationsStore.setState({ isLoading: true });

      mockNotificationsAllRequest.mockResolvedValueOnce(mockNotifications);

      await useNotificationsStore.getState().fetchNotifications("user-123");

      // Should not have called API because isLoading was true
      expect(mockNotificationsAllRequest).not.toHaveBeenCalled();
    });

    it("should call API with correct filter params", async () => {
      mockNotificationsAllRequest.mockResolvedValueOnce([]);

      await useNotificationsStore.getState().fetchNotifications("user-123");

      expect(mockNotificationsAllRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          sorting: expect.objectContaining({
            key: "sentAt",
            direction: 1, // Descending
          }),
          filters: expect.arrayContaining([
            expect.objectContaining({
              key: "userId",
              values: ["user-123"],
            }),
          ]),
          pageRequest: expect.objectContaining({
            currentPage: 1,
            perPageCount: 50,
          }),
        })
      );
    });
  });

  // ─── markAsRead ─────────────────────────────────────────

  describe("markAsRead", () => {
    it("should optimistically mark a notification as read", async () => {
      useNotificationsStore.setState({
        notifications: [
          {
            id: "notif-1",
            userId: "user-123",
            title: "Test",
            message: "Test message",
            type: 1,
            isRead: false,
            sentAt: "2026-02-27T10:00:00Z",
            createdAt: "2026-02-27T10:00:00Z",
          },
        ],
        unreadCount: 1,
      });

      mockNotificationsUpdateRequest.mockResolvedValueOnce({});

      await useNotificationsStore.getState().markAsRead("notif-1");

      const state = useNotificationsStore.getState();
      expect(state.notifications[0].isRead).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it("should skip already-read notifications", async () => {
      useNotificationsStore.setState({
        notifications: [
          {
            id: "notif-1",
            userId: "user-123",
            title: "Test",
            message: "Test message",
            type: 1,
            isRead: true,
            sentAt: "2026-02-27T10:00:00Z",
            createdAt: "2026-02-27T10:00:00Z",
          },
        ],
        unreadCount: 0,
      });

      await useNotificationsStore.getState().markAsRead("notif-1");

      expect(mockNotificationsUpdateRequest).not.toHaveBeenCalled();
    });

    it("should skip non-existent notifications", async () => {
      useNotificationsStore.setState({
        notifications: [],
        unreadCount: 0,
      });

      await useNotificationsStore.getState().markAsRead("non-existent");

      expect(mockNotificationsUpdateRequest).not.toHaveBeenCalled();
    });

    it("should revert optimistic update on API error", async () => {
      useNotificationsStore.setState({
        notifications: [
          {
            id: "notif-1",
            userId: "user-123",
            title: "Test",
            message: "Test message",
            type: 1,
            isRead: false,
            sentAt: "2026-02-27T10:00:00Z",
            createdAt: "2026-02-27T10:00:00Z",
          },
        ],
        unreadCount: 1,
      });

      mockNotificationsUpdateRequest.mockRejectedValueOnce(
        new Error("Server error")
      );

      await useNotificationsStore.getState().markAsRead("notif-1");

      const state = useNotificationsStore.getState();
      expect(state.notifications[0].isRead).toBe(false);
      expect(state.unreadCount).toBe(1);
    });
  });

  // ─── markAllAsRead ──────────────────────────────────────

  describe("markAllAsRead", () => {
    it("should optimistically mark all notifications as read", async () => {
      useNotificationsStore.setState({
        notifications: [
          {
            id: "notif-1",
            userId: "user-123",
            title: "Test 1",
            message: "Msg 1",
            type: 1,
            isRead: false,
            sentAt: "2026-02-27T10:00:00Z",
            createdAt: "2026-02-27T10:00:00Z",
          },
          {
            id: "notif-2",
            userId: "user-123",
            title: "Test 2",
            message: "Msg 2",
            type: 2,
            isRead: false,
            sentAt: "2026-02-27T09:00:00Z",
            createdAt: "2026-02-27T09:00:00Z",
          },
        ],
        unreadCount: 2,
      });

      mockNotificationsUpdateRequest.mockResolvedValue({});

      await useNotificationsStore.getState().markAllAsRead();

      const state = useNotificationsStore.getState();
      expect(state.notifications.every((n) => n.isRead)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it("should skip if there are no unread notifications", async () => {
      useNotificationsStore.setState({
        notifications: [
          {
            id: "notif-1",
            userId: "user-123",
            title: "Test",
            message: "Msg",
            type: 1,
            isRead: true,
            sentAt: "2026-02-27T10:00:00Z",
            createdAt: "2026-02-27T10:00:00Z",
          },
        ],
        unreadCount: 0,
      });

      await useNotificationsStore.getState().markAllAsRead();

      expect(mockNotificationsUpdateRequest).not.toHaveBeenCalled();
    });

    it("should revert optimistic update on API error", async () => {
      useNotificationsStore.setState({
        notifications: [
          {
            id: "notif-1",
            userId: "user-123",
            title: "Test 1",
            message: "Msg 1",
            type: 1,
            isRead: false,
            sentAt: "2026-02-27T10:00:00Z",
            createdAt: "2026-02-27T10:00:00Z",
          },
          {
            id: "notif-2",
            userId: "user-123",
            title: "Test 2",
            message: "Msg 2",
            type: 2,
            isRead: true,
            sentAt: "2026-02-27T09:00:00Z",
            createdAt: "2026-02-27T09:00:00Z",
          },
        ],
        unreadCount: 1,
      });

      mockNotificationsUpdateRequest.mockRejectedValue(
        new Error("Server error")
      );

      await useNotificationsStore.getState().markAllAsRead();

      const state = useNotificationsStore.getState();
      // notif-1 should be reverted to unread, notif-2 should stay read
      const notif1 = state.notifications.find((n) => n.id === "notif-1");
      const notif2 = state.notifications.find((n) => n.id === "notif-2");
      expect(notif1!.isRead).toBe(false);
      expect(notif2!.isRead).toBe(true);
      expect(state.unreadCount).toBe(1);
    });
  });

  // ─── clearNotifications ─────────────────────────────────

  describe("clearNotifications", () => {
    it("should clear all notifications and reset state", () => {
      useNotificationsStore.setState({
        notifications: [
          {
            id: "notif-1",
            userId: "user-123",
            title: "Test",
            message: "Msg",
            type: 1,
            isRead: false,
            sentAt: "2026-02-27T10:00:00Z",
            createdAt: "2026-02-27T10:00:00Z",
          },
        ],
        unreadCount: 1,
        lastFetched: Date.now(),
        retryCount: 2,
      });

      useNotificationsStore.getState().clearNotifications();

      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.lastFetched).toBeNull();
      expect(state.retryCount).toBe(0);
    });
  });
});
