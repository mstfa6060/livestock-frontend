"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Heart,
  Eye,
  MessageSquare,
  TrendingUp,
  PlusCircle,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tn = useTranslations("dashboardNav");
  const { user } = useAuth();

  // Mock stats - in production, fetch from API
  const stats = {
    totalListings: 5,
    activeListings: 3,
    totalViews: 234,
    totalFavorites: 12,
    unreadMessages: 3,
  };

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
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% {t("stats.thisWeek")}
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
              {t("stats.onYourListings")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.messages")}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
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
            <div className="text-sm text-muted-foreground text-center py-8">
              {t("noListings")}
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/my-listings">{t("viewAllListings")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentMessages")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              {t("noMessages")}
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/messages">{t("viewAllMessages")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
