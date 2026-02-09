"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/contexts/AuthContext";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import {
  Package,
  Heart,
  Eye,
  MessageSquare,
  Bell,
  PlusCircle,
} from "lucide-react";

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalFavorites: number;
  unreadNotifications: number;
}

interface RecentListing {
  id: string;
  title: string;
  status: number;
  viewCount: number;
  createdAt: Date;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tn = useTranslations("dashboardNav");
  const { user } = useAuth();

  const { unreadCount: unreadNotifications, fetchNotifications } = useNotificationsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalFavorites: 0,
    unreadNotifications: 0,
  });
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch stats from Dashboard API
        const statsResponse = await LivestockTradingAPI.Dashboard.MyStats.Request({
          userId: user.id,
        });

        // Fetch recent listings for the activity section
        const productsResponse = await LivestockTradingAPI.Products.All.Request({
          countryCode: "TR",
          sorting: {
            key: "createdAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          filters: [
            {
              key: "sellerId",
              type: "guid",
              isUsed: true,
              values: [user.id],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: {
            currentPage: 1,
            perPageCount: 5,
            listAll: false,
          },
        });

        // Get recent listings (top 5)
        const recent = productsResponse.slice(0, 5).map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          viewCount: p.viewCount,
          createdAt: p.createdAt,
        }));

        // Fetch notifications
        await fetchNotifications(user.id);

        setStats({
          totalListings: statsResponse.totalListings,
          activeListings: statsResponse.activeListings,
          totalViews: statsResponse.totalViews,
          totalFavorites: statsResponse.totalFavorites,
          unreadNotifications,
        });

        setRecentListings(recent);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id, unreadNotifications, fetchNotifications]);

  // Get status text
  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      0: t("stats.draft"),
      1: t("stats.active"),
      2: t("stats.sold"),
      3: t("stats.pending"),
    };
    return statusMap[status] || t("stats.draft");
  };

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
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
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
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeListings} {t("stats.active")}
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
            <div className="text-2xl font-bold">{stats.totalViews}</div>
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
            <div className="text-2xl font-bold">{stats.totalFavorites}</div>
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

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentListings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentListings.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                {t("noListings")}
              </div>
            ) : (
              <div className="space-y-4">
                {recentListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {listing.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getStatusText(listing.status)} • {listing.viewCount} {t("stats.views")}
                      </p>
                    </div>
                  </Link>
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
      </div>
    </DashboardLayout>
  );
}
