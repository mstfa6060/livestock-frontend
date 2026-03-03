"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageSquare,
  Settings,
  PlusCircle,
  User,
  Bell,
  Store,
  FolderTree,
  HandCoins,
  Handshake,
  Tractor,
  Truck,
  ShieldCheck,
  Tag,
  Send,
  MapPin,
  DollarSign,
  ClipboardPlus,
  Syringe,
} from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { Roles } from "@/constants/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useMessagesStore } from "@/stores/useMessagesStore";
import { useUnreadCount } from "@/hooks/queries/useNotifications";

interface MenuItem {
  key: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  requiredRoles?: string[];
  badgeKey?: "messages" | "notifications";
}

const menuItems: MenuItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "myListings", href: "/dashboard/my-listings", icon: Package },
  { key: "offers", href: "/dashboard/offers", icon: HandCoins },
  { key: "deals", href: "/dashboard/deals", icon: Handshake },
  { key: "farms", href: "/dashboard/farms", icon: Tractor },
  { key: "transport", href: "/dashboard/transport", icon: Truck },
  { key: "transportOffers", href: "/dashboard/transport-offers", icon: Send },
  { key: "locations", href: "/dashboard/locations", icon: MapPin },
  { key: "healthRecords", href: "/dashboard/health-records", icon: ClipboardPlus, requiredRoles: [Roles.Seller, Roles.Veterinarian] },
  { key: "vaccinations", href: "/dashboard/vaccinations", icon: Syringe, requiredRoles: [Roles.Seller, Roles.Veterinarian] },
  { key: "becomeSeller", href: "/dashboard/become-seller", icon: Store },
  { key: "moderation", href: "/dashboard/moderation", icon: ShieldCheck, adminOnly: true },
  { key: "sellerModeration", href: "/dashboard/seller-moderation", icon: Store, adminOnly: true },
  { key: "transporterModeration", href: "/dashboard/transporter-moderation", icon: Truck, adminOnly: true },
  { key: "categories", href: "/dashboard/categories", icon: FolderTree, adminOnly: true },
  { key: "brands", href: "/dashboard/brands", icon: Tag, adminOnly: true },
  { key: "shippingCarriers", href: "/dashboard/shipping-carriers", icon: Truck, adminOnly: true },
  { key: "shippingZones", href: "/dashboard/shipping-zones", icon: MapPin, adminOnly: true },
  { key: "shippingRates", href: "/dashboard/shipping-rates", icon: DollarSign, adminOnly: true },
  { key: "systemSettings", href: "/dashboard/system-settings", icon: Settings, adminOnly: true },
  { key: "favorites", href: "/dashboard/favorites", icon: Heart },
  { key: "messages", href: "/dashboard/messages", icon: MessageSquare, badgeKey: "messages" },
  { key: "notifications", href: "/dashboard/notifications", icon: Bell, badgeKey: "notifications" },
  { key: "profile", href: "/dashboard/profile", icon: User },
  { key: "settings", href: "/settings", icon: Settings },
];

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground min-w-[18px]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const t = useTranslations("dashboardNav");
  const { isAdmin, isStaff, hasAnyRole } = useRoles();
  const { user } = useAuth();

  const unreadMessages = useMessagesStore((s) => s.unreadCount);
  const fetchUnreadCount = useMessagesStore((s) => s.fetchUnreadCount);
  const unreadNotifications = useUnreadCount(user?.id ?? "");

  // Fetch unread message count on mount
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount(user.id);
    }
  }, [user?.id, fetchUnreadCount]);

  // Remove locale prefix from pathname for comparison
  const currentPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  const visibleItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin && !isStaff) return false;
    if (item.requiredRoles && !isAdmin && !isStaff && !hasAnyRole(item.requiredRoles)) return false;
    return true;
  });

  const getBadgeCount = (badgeKey?: "messages" | "notifications") => {
    if (badgeKey === "messages") return unreadMessages;
    if (badgeKey === "notifications") return unreadNotifications;
    return 0;
  };

  return (
    <aside className="w-64 border-r bg-background min-h-[calc(100vh-4rem)] p-4 hidden lg:block">
      {/* New Listing Button */}
      <Button className="w-full mb-6" asChild>
        <Link href="/dashboard/listings/new">
          <PlusCircle className="h-4 w-4 mr-2" />
          {t("newListing")}
        </Link>
      </Button>

      {/* Navigation */}
      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath.startsWith(item.href));

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
              <UnreadBadge count={getBadgeCount(item.badgeKey)} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Mobile bottom navigation
export function DashboardMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("dashboardNav");
  const { user } = useAuth();

  const unreadMessages = useMessagesStore((s) => s.unreadCount);
  const fetchUnreadCount = useMessagesStore((s) => s.fetchUnreadCount);

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount(user.id);
    }
  }, [user?.id, fetchUnreadCount]);

  const currentPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  const mobileItems = [
    { key: "overview", href: "/dashboard", icon: LayoutDashboard },
    { key: "myListings", href: "/dashboard/my-listings", icon: Package },
    { key: "favorites", href: "/dashboard/favorites", icon: Heart },
    { key: "messages", href: "/dashboard/messages", icon: MessageSquare, showBadge: true },
    { key: "profile", href: "/dashboard/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background lg:hidden z-50">
      <div className="flex justify-around py-2">
        {mobileItems.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath.startsWith(item.href));

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.showBadge && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center rounded-full bg-destructive w-4 h-4 text-[9px] font-medium text-destructive-foreground">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
