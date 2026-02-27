"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { getDateLocale } from "@/lib/date-locale";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  MessageSquare,
  Tag,
  Package,
  Info,
  CheckCheck,
  Check,
} from "lucide-react";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type Notification,
} from "@/hooks/queries/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Map notification types to icons and labels
const notificationConfig: Record<number, { icon: React.ReactNode; labelKey: string }> = {
  0: { icon: <Info className="h-5 w-5" />, labelKey: "system" },
  1: { icon: <MessageSquare className="h-5 w-5" />, labelKey: "message" },
  2: { icon: <Tag className="h-5 w-5" />, labelKey: "offer" },
  3: { icon: <Package className="h-5 w-5" />, labelKey: "order" },
  4: { icon: <Package className="h-5 w-5" />, labelKey: "listing" },
};

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data: notifications = [], isLoading, refetch } = useNotifications(userId);
  const unreadCount = useUnreadCount(userId);
  const markAsReadMutation = useMarkAsReadMutation(userId);
  const markAllAsReadMutation = useMarkAllAsReadMutation(userId);

  // Force refresh on page visit
  useEffect(() => {
    if (userId) {
      refetch();
    }
  }, [userId, refetch]);

  // Format notification time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: getDateLocale(locale),
    });
  };

  // Group notifications by date
  const groupNotifications = (notifications: Notification[]) => {
    const groups: { label: string; notifications: Notification[] }[] = [];
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    notifications.forEach((notification) => {
      const date = new Date(notification.sentAt);
      if (isToday(date)) {
        today.push(notification);
      } else if (isYesterday(date)) {
        yesterday.push(notification);
      } else {
        older.push(notification);
      }
    });

    if (today.length > 0) {
      groups.push({ label: t("today"), notifications: today });
    }
    if (yesterday.length > 0) {
      groups.push({ label: t("yesterday"), notifications: yesterday });
    }
    if (older.length > 0) {
      groups.push({ label: t("older"), notifications: older });
    }

    return groups;
  };

  const notificationGroups = groupNotifications(notifications);

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      {/* Actions bar */}
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {t("markAllAsRead")}
          </Button>
        </div>
      )}

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notificationGroups.map((group) => (
            <div key={group.label}>
              {/* Group header */}
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {group.label}
              </h3>

              {/* Group notifications */}
              <div className="space-y-3">
                {group.notifications.map((notification) => {
                  const config = notificationConfig[notification.type] || {
                    icon: <Info className="h-5 w-5" />,
                    labelKey: "system",
                  };

                  return (
                    <Card
                      key={notification.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/50",
                        !notification.isRead && "border-primary/50 bg-primary/5"
                      )}
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          markAsReadMutation.mutate(notification.id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              notification.isRead
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {config.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm",
                                  !notification.isRead && "font-medium"
                                )}
                              >
                                {notification.title}
                              </p>
                              {notification.isRead ? (
                                <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {t(`types.${config.labelKey}`)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                •
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.sentAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
