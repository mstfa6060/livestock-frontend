"use client";

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
} from "lucide-react";

const menuItems = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "myListings", href: "/dashboard/my-listings", icon: Package },
  { key: "becomeSeller", href: "/dashboard/become-seller", icon: Store },
  { key: "favorites", href: "/dashboard/favorites", icon: Heart },
  { key: "messages", href: "/dashboard/messages", icon: MessageSquare },
  { key: "notifications", href: "/dashboard/notifications", icon: Bell },
  { key: "profile", href: "/dashboard/profile", icon: User },
  { key: "settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const t = useTranslations("dashboardNav");

  // Remove locale prefix from pathname for comparison
  const currentPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");

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
        {menuItems.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath.startsWith(item.href));

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
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

  const currentPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  const mobileItems = [
    { key: "overview", href: "/dashboard", icon: LayoutDashboard },
    { key: "myListings", href: "/dashboard/my-listings", icon: Package },
    { key: "favorites", href: "/dashboard/favorites", icon: Heart },
    { key: "messages", href: "/dashboard/messages", icon: MessageSquare },
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
                "flex flex-col items-center gap-1 px-3 py-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
