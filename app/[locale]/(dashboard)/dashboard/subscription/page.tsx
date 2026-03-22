"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Crown,
  CreditCard,
  Calendar,
  ArrowUpRight,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerByUserId } from "@/hooks/queries";
import {
  useSellerSubscription,
  useUpdateSubscription,
} from "@/hooks/queries/useSubscription";
import { toast } from "sonner";

// Status: 0=Active, 1=Expired, 2=Cancelled, 3=GracePeriod
const STATUS_MAP: Record<number, string> = {
  0: "active",
  1: "expired",
  2: "cancelled",
  3: "gracePeriod",
};

const STATUS_VARIANT: Record<number, "default" | "secondary" | "destructive" | "outline"> = {
  0: "default",
  1: "destructive",
  2: "secondary",
  3: "outline",
};

const TIER_KEYS: Record<number, string> = {
  0: "freePlan",
  1: "basicPlan",
  2: "proPlan",
  3: "businessPlan",
};

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDaysRemaining(expiresAt: Date | string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function SubscriptionPage() {
  const t = useTranslations("subscription");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Fetch seller profile
  const { data: sellerData, isLoading: isSellerLoading } =
    useSellerByUserId(user?.id ?? "", { enabled: !!user?.id });
  const sellerId = (sellerData as { id?: string })?.id ?? null;

  // Fetch current subscription
  const { data: subscription, isLoading: isSubLoading } =
    useSellerSubscription(sellerId ?? "");

  const updateSubscription = useUpdateSubscription();

  const isLoading = isSellerLoading || isSubLoading;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any;
  const hasSubscription = sub && sub.id;
  const status = hasSubscription ? sub.status : -1;
  const daysRemaining = hasSubscription
    ? getDaysRemaining(sub.expiresAt)
    : 0;

  const maxListings = hasSubscription ? sub.maxActiveListings : 3;
  const currentListings = hasSubscription
    ? sub.currentActiveListings
    : 0;
  const remainingListings = hasSubscription
    ? sub.remainingListings
    : maxListings - currentListings;
  const usagePercent =
    maxListings > 0
      ? Math.min(100, (currentListings / maxListings) * 100)
      : 0;

  const handleAutoRenewToggle = async (checked: boolean) => {
    if (!hasSubscription) return;
    try {
      await updateSubscription.mutateAsync({
        id: sub.id,
        autoRenew: checked,
        receipt: "",
      });
      toast.success(checked ? t("autoRenewOn") : t("autoRenewOff"));
    } catch {
      toast.error(t("autoRenewOff"));
    }
  };

  const handleCancelSubscription = async () => {
    if (!hasSubscription) return;
    try {
      await updateSubscription.mutateAsync({
        id: sub.id,
        status: 2, // Cancelled
        receipt: "",
      });
      toast.success(t("cancelled"));
      setCancelDialogOpen(false);
    } catch {
      toast.error(t("cancelConfirmTitle"));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title={t("mySubscription")}
        description={t("subscriptionStatus")}
      >
        <SubscriptionSkeleton />
      </DashboardLayout>
    );
  }

  // No subscription - show free plan info
  if (!hasSubscription) {
    return (
      <DashboardLayout
        title={t("mySubscription")}
        description={t("subscriptionStatus")}
      >
        <Card className="max-w-xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <CreditCard className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">
              {t("noSubscription")}
            </h2>
            <p className="text-muted-foreground">
              {t("noSubscriptionDesc")}
            </p>
            <div className="pt-2">
              <Button asChild size="lg">
                <Link href="/pricing">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  {t("upgradePlan")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={t("mySubscription")}
      description={t("subscriptionStatus")}
    >
      {/* Status Alerts */}
      {status === 1 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{t("subscriptionExpired")}</p>
          <Button variant="destructive" size="sm" className="ml-auto" asChild>
            <Link href="/pricing">{t("upgrade")}</Link>
          </Button>
        </div>
      )}

      {status === 2 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-orange-500/50 bg-orange-500/10 p-4 text-sm text-orange-700 dark:text-orange-400">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{t("subscriptionCancelled")}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("currentPlan")}
            </CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {sub.planName ||
                  t(TIER_KEYS[sub.planTier] ?? "freePlan")}
              </h2>
              <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
                {t(STATUS_MAP[status] ?? "active")}
              </Badge>
            </div>

            {/* Expiry */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {t("expiresAt")}:{" "}
                {new Date(sub.expiresAt).toLocaleDateString()}
              </span>
            </div>

            {daysRemaining > 0 && status === 0 && (
              <p className="text-sm font-medium text-primary">
                {t("daysRemaining", { days: daysRemaining })}
              </p>
            )}

            {/* Auto Renew Toggle */}
            {status === 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t("autoRenew")}</p>
                  <p className="text-xs text-muted-foreground">
                    {sub.autoRenew
                      ? t("autoRenewOn")
                      : t("autoRenewOff")}
                  </p>
                </div>
                <Switch
                  checked={sub.autoRenew}
                  onCheckedChange={handleAutoRenewToggle}
                  disabled={updateSubscription.isPending}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listing Usage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("listingUsage")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {t("listingsUsed", {
                    used: currentListings,
                    total:
                      maxListings === 0
                        ? t("unlimited")
                        : maxListings,
                  })}
                </span>
                {maxListings > 0 && (
                  <span className="font-medium">
                    {Math.round(usagePercent)}%
                  </span>
                )}
              </div>
              {maxListings > 0 && (
                <Progress value={usagePercent} className="h-2" />
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {t("remainingListings")}
              </p>
              <p className="text-2xl font-bold">
                {maxListings === 0
                  ? t("unlimited")
                  : remainingListings}
              </p>
            </div>

            {/* Additional plan features */}
            <div className="pt-2 border-t text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("photosPerListing")}
                </span>
                <span className="font-medium">
                  {sub.maxPhotosPerListing}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("monthlyBoostCredits")}
                </span>
                <span className="font-medium">
                  {sub.monthlyBoostCredits > 0
                    ? t("boostCredits", {
                        count: sub.monthlyBoostCredits,
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/pricing">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                {t("upgradePlan")}
              </Link>
            </Button>
            {status === 0 && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                {t("cancelSubscription")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("cancelConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {tc("back")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={updateSubscription.isPending}
            >
              {t("cancelConfirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
