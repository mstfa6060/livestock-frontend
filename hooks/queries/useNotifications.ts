import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
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

/**
 * Fetch notifications for a user.
 * Replaces the manual fetch/cache/retry logic from useNotificationsStore.
 */
export function useNotifications(userId: string) {
  return useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Notifications.All.Request({
        sorting: {
          key: "sentAt",
          direction:
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
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

      return response.map(
        (n): Notification => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          sentAt: n.sentAt.toString(),
          createdAt: n.createdAt.toString(),
        })
      );
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

/**
 * Derive unread count from notifications query data.
 */
export function useUnreadCount(userId: string) {
  const { data } = useNotifications(userId);
  return data?.filter((n) => !n.isRead).length ?? 0;
}

/**
 * Mark a single notification as read with optimistic update.
 */
export function useMarkAsReadMutation(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.notifications.list(userId);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      // Look up the notification from the cache snapshot saved in onMutate context
      // We use the variable to find the notification, but the actual data is from context
      const notifications = queryClient.getQueryData<Notification[]>(queryKey);
      const notification = notifications?.find((n) => n.id === notificationId);
      if (!notification) return;

      await LivestockTradingAPI.Notifications.Update.Request({
        id: notificationId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionUrl: notification.actionUrl || "",
        actionData: notification.actionData || "",
        isRead: true,
      });
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Notification[]>(queryKey);

      // Check if notification exists and is unread
      const notification = previous?.find((n) => n.id === notificationId);
      if (!notification || notification.isRead) {
        return { previous, skip: true };
      }

      // Optimistic update
      queryClient.setQueryData<Notification[]>(queryKey, (old) =>
        old?.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );

      return { previous, skip: false };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}

/**
 * Mark all notifications as read with optimistic update.
 */
export function useMarkAllAsReadMutation(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.notifications.list(userId);

  return useMutation({
    mutationFn: async () => {
      const notifications = queryClient.getQueryData<Notification[]>(queryKey);
      const unread = notifications?.filter((n) => !n.isRead) ?? [];
      if (unread.length === 0) return;

      await Promise.all(
        unread.map((notification) =>
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
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Notification[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData<Notification[]>(queryKey, (old) =>
        old?.map((n) => ({ ...n, isRead: true }))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}
