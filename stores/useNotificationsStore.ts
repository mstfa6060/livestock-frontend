import { create } from "zustand";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: number;
  actionUrl?: string;
  actionData?: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  retryCount: number;
  // Actions
  fetchNotifications: (userId: string, force?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
}

// Cache duration in milliseconds (2 minutes)
const CACHE_DURATION = 2 * 60 * 1000;
const MAX_RETRIES = 3;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,
  retryCount: 0,

  fetchNotifications: async (userId: string, force = false) => {
    // Check cache (skip if forced)
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      return; // Use cached data
    }

    // Prevent concurrent fetches
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const response = await LivestockTradingAPI.Notifications.All.Request({
        sorting: {
          key: "sentAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [
          {
            key: "userId",
            type: "guid",
            isUsed: true,
            values: [userId],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      });

      const notifications: Notification[] = response.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        sentAt: n.sentAt.toString(),
        createdAt: n.createdAt.toString(),
      }));

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      set({
        notifications,
        unreadCount,
        isLoading: false,
        lastFetched: Date.now(),
        retryCount: 0,
        error: null,
      });
    } catch (error) {

      const { retryCount } = get();

      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
        retryCount: retryCount + 1,
      });

      // Auto-retry with exponential backoff (max 3 retries)
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          get().fetchNotifications(userId, true);
        }, delay);
      }
    }
  },

  markAsRead: async (notificationId: string) => {
    const { notifications } = get();
    const notification = notifications.find((n) => n.id === notificationId);

    if (!notification || notification.isRead) return;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await LivestockTradingAPI.Notifications.Update.Request({
        id: notificationId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionUrl: notification.actionUrl || "",
        actionData: notification.actionData || "",
        isRead: true,
      });
    } catch {
      // Revert optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: false } : n
        ),
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadNotifications = notifications.filter((n) => !n.isRead);

    if (unreadNotifications.length === 0) return;

    // Optimistic update
    const previousUnreadCount = get().unreadCount;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          LivestockTradingAPI.Notifications.Update.Request({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            actionUrl: notification.actionUrl || "",
            actionData: notification.actionData || "",
            isRead: true,
          })
        )
      );
    } catch {
      // Revert optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) => {
          const wasUnread = unreadNotifications.some((un) => un.id === n.id);
          return wasUnread ? { ...n, isRead: false } : n;
        }),
        unreadCount: previousUnreadCount,
      }));
    }
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      lastFetched: null,
      retryCount: 0,
    });
  },
}));
