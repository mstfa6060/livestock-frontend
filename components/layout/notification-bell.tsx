"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/lib/date-locale";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, MessageSquare, Tag, Package, Info, CheckCheck, ShoppingCart, Truck, PackageCheck, XCircle, CreditCard, AlertCircle, TrendingDown, Star, ShieldCheck, CheckCircle, ClipboardList } from "lucide-react";
import { useNotifications, useUnreadCount, useMarkAsReadMutation, useMarkAllAsReadMutation } from "@/hooks/queries/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Map backend NotificationType enum to icons
const notificationIcons: Record<number, React.ReactNode> = {
  0: <ShoppingCart className="h-4 w-4" />,   // OrderPlaced
  1: <Truck className="h-4 w-4" />,           // OrderShipped
  2: <PackageCheck className="h-4 w-4" />,    // OrderDelivered
  3: <XCircle className="h-4 w-4" />,         // OrderCancelled
  4: <CreditCard className="h-4 w-4" />,      // PaymentReceived
  5: <AlertCircle className="h-4 w-4" />,     // PaymentFailed
  6: <MessageSquare className="h-4 w-4" />,   // NewMessage
  7: <Package className="h-4 w-4" />,         // ProductBackInStock
  8: <TrendingDown className="h-4 w-4" />,    // PriceDropAlert
  9: <Star className="h-4 w-4" />,            // NewReview
  10: <ShieldCheck className="h-4 w-4" />,    // SellerVerified
  11: <CheckCircle className="h-4 w-4" />,    // ProductApproved
  12: <XCircle className="h-4 w-4" />,        // ProductRejected
  13: <ClipboardList className="h-4 w-4" />,  // ProductPendingApproval
  99: <Info className="h-4 w-4" />,           // System
};

export function NotificationBell() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? "";
  const { data: notifications = [], isLoading } = useNotifications(userId);
  const unreadCount = useUnreadCount(userId);
  const markAsReadMutation = useMarkAsReadMutation(userId);
  const markAllAsReadMutation = useMarkAllAsReadMutation(userId);

  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Format notification time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: getDateLocale(locale),
    });
  };

  // Handle notification click - mark as read and navigate if actionUrl exists
  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    markAsReadMutation.mutate(notificationId);
    setIsOpen(false);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  // Get recent notifications (top 5)
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("title")}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">{t("title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-semibold">{t("title")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t("markAllAsRead")}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Notifications list */}
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t("noNotifications")}</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.isRead && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
              >
                <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                  {notificationIcons[notification.type] || <Info className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm truncate",
                      !notification.isRead && "font-medium"
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(notification.sentAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm" asChild>
                <Link href="/dashboard/notifications">{t("viewAll")}</Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
