"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCount } from "@/hooks/queries/useNotifications";
import { RecentlyViewedProducts } from "@/components/features/recently-viewed-products";
import { useDashboardMyStats, useDashboardStats } from "@/hooks/queries";
import {
  Package,
  Heart,
  Eye,
  MessageSquare,
  Bell,
  PlusCircle,
  ShoppingCart,
  FileEdit,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tn = useTranslations("dashboardNav");
  const { user } = useAuth();

  const unreadNotifications = useUnreadCount(user?.id ?? "");

  const { data: stats, isLoading: isMyStatsLoading } = useDashboardMyStats(
    user?.id ?? "",
    { enabled: !!user?.id }
  );
  const { data: sellerStats, isLoading: isStatsLoading } = useDashboardStats(
    user?.id ?? "",
    { enabled: !!user?.id }
  );

  const isLoading = isMyStatsLoading || isStatsLoading;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsData = stats as any;

  if (isLoading) {
    return (
      <DashboardLayout
        title={t("welcome", { name: user?.displayName || "" })}
        description={t("accountInfo")}
      >
        <div className="mb-8">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={t("welcome", { name: user?.displayName || "" })}
      description={t("accountInfo")}
    >
      {/* Quick Actions */}
      <div className="mb-8">
        <Button asChild>
          <Link href="/dashboard/listings/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            {tn("newListing")}
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.totalListings")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalListings ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {statsData?.activeListings ?? 0} {t("stats.active")}
              {(statsData?.draftListings ?? 0) > 0 && (
                <> · {statsData?.draftListings} {t("stats.draft")}</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.totalViews")}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalViews ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("stats.allTime")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.favorites")}
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalFavorites ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("stats.savedItems")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.notifications")}
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">{t("stats.unread")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.messages")}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalMessages ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {statsData?.unreadMessages ?? 0} {t("stats.unread")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.sold")}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.soldListings ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("stats.allTime")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.pending")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.pendingListings ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("stats.awaitingApproval")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seller Revenue Stats */}
      {sellerStats && (Number(sellerStats.totalSales) > 0 || Number(sellerStats.revenue) > 0) && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.totalSales")}
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sellerStats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                {t("stats.completedSales")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.revenue")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(sellerStats.revenue).toLocaleString()} ₺
              </div>
              <p className="text-xs text-muted-foreground">
                {t("stats.totalRevenue")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity, Quick Links & Recently Viewed */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!statsData?.recentActivity || statsData.recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                {t("noActivity")}
              </div>
            ) : (
              <div className="space-y-4">
                {statsData.recentActivity.slice(0, 5).map((activity: Record<string, unknown>, i: number) => (
                  <div
                    key={`${activity.entityId}-${i}`}
                    className="flex items-start gap-3 p-2 rounded-lg"
                  >
                    <ActivityIcon type={activity.type as string} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.entityTitle as string}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.actorName as string}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/my-listings">{t("viewAllListings")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("quickLinks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("viewAllMessages")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/notifications">
                <Bell className="h-4 w-4 mr-2" />
                {t("viewNotifications")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/favorites">
                <Heart className="h-4 w-4 mr-2" />
                {t("viewFavorites")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <RecentlyViewedProducts />
      </div>
    </DashboardLayout>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "listing_created":
    case "listing_updated":
      return <FileEdit className="h-4 w-4 mt-0.5 text-blue-500" />;
    case "listing_sold":
      return <ShoppingCart className="h-4 w-4 mt-0.5 text-green-500" />;
    case "message_received":
      return <MessageSquare className="h-4 w-4 mt-0.5 text-purple-500" />;
    case "favorite_added":
      return <Heart className="h-4 w-4 mt-0.5 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 mt-0.5 text-muted-foreground" />;
  }
}
