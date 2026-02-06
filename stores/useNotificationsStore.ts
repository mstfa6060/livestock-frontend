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
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchNotifications: async (userId: string) => {
    // Check cache
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      return; // Use cached data
    }

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
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    const { notifications } = get();
    const notification = notifications.find((n) => n.id === notificationId);

    if (!notification || notification.isRead) return;

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

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadNotifications = notifications.filter((n) => !n.isRead);

    try {
      // Mark all unread notifications as read
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

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      lastFetched: null,
    });
  },
}));
