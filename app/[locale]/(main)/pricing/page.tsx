"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Crown, Zap, Star } from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/queries/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string;
  tier: number;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxActiveListings: number;
  maxPhotosPerListing: number;
  monthlyBoostCredits: number;
  hasDetailedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasFeaturedBadge: boolean;
  sortOrder: number;
  isActive: boolean;
}

// Tier names for mapping
const TIER_KEYS: Record<number, string> = {
  0: "freePlan",
  1: "basicPlan",
  2: "proPlan",
  3: "businessPlan",
};

const TIER_ICONS: Record<number, typeof Star> = {
  0: Star,
  1: Zap,
  2: Crown,
  3: Crown,
};

function PlanCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="text-center pb-2">
        <Skeleton className="h-6 w-24 mx-auto mb-2" />
        <Skeleton className="h-10 w-32 mx-auto mb-1" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </CardHeader>
      <CardContent className="flex-1 space-y-4 pt-4">
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
        <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
    </Card>
  );
}

function FeatureRow({
  label,
  value,
  isBoolean,
}: {
  label: string;
  value: string | number | boolean;
  isBoolean?: boolean;
}) {
  if (isBoolean) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        {value ? (
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
        )}
        <span
          className={cn(
            "text-sm",
            !value && "text-muted-foreground/60"
          )}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function PricingPage() {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const { data: plansRaw = [], isLoading } = useSubscriptionPlans(locale);
  const plans = (plansRaw as Plan[])
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return t("freePlan");
    return `${price.toLocaleString(locale)} ${currency}`;
  };

  const getYearlySavings = (plan: Plan) => {
    if (plan.priceMonthly === 0) return 0;
    const monthlyTotal = plan.priceMonthly * 12;
    return monthlyTotal - plan.priceYearly;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("comparePlans")}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <Tabs
            value={billingPeriod}
            onValueChange={(v) =>
              setBillingPeriod(v as "monthly" | "yearly")
            }
          >
            <TabsList className="grid w-64 grid-cols-2">
              <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
              <TabsTrigger value="yearly" className="relative">
                {t("yearly")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {billingPeriod === "yearly" && (
            <Badge
              variant="secondary"
              className="ml-3 self-center bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              {t("yearlyDiscount")}
            </Badge>
          )}
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {t("comparePlans")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.tier === 2;
              const price =
                billingPeriod === "monthly"
                  ? plan.priceMonthly
                  : plan.priceYearly;
              const savings = getYearlySavings(plan);
              const TierIcon = TIER_ICONS[plan.tier] ?? Star;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "flex flex-col relative",
                    isPopular &&
                      "border-primary shadow-lg ring-1 ring-primary/20"
                  )}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {t("popular")}
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2 pt-6">
                    <div className="flex justify-center mb-2">
                      <TierIcon
                        className={cn(
                          "h-8 w-8",
                          plan.tier === 0 && "text-muted-foreground",
                          plan.tier === 1 && "text-blue-500",
                          plan.tier === 2 && "text-amber-500",
                          plan.tier === 3 && "text-purple-500"
                        )}
                      />
                    </div>
                    <CardTitle className="text-xl">
                      {plan.name ||
                        t(TIER_KEYS[plan.tier] ?? "freePlan")}
                    </CardTitle>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col pt-4">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold">
                        {formatPrice(price, plan.currency)}
                      </div>
                      {price > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {billingPeriod === "monthly"
                            ? t("perMonth")
                            : t("perYear")}
                        </p>
                      )}
                      {billingPeriod === "yearly" && savings > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                          {savings.toLocaleString(locale)}{" "}
                          {plan.currency} {t("yearlyDiscount")}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex-1 border-t pt-4 space-y-1">
                      <FeatureRow
                        label={t("listingLimit")}
                        value={
                          plan.maxActiveListings === 0
                            ? t("unlimited")
                            : t("freeListings", {
                                count: plan.maxActiveListings,
                              })
                        }
                      />
                      <FeatureRow
                        label={t("photosPerListing")}
                        value={plan.maxPhotosPerListing}
                      />
                      <FeatureRow
                        label={t("monthlyBoostCredits")}
                        value={
                          plan.monthlyBoostCredits > 0
                            ? t("boostCredits", {
                                count: plan.monthlyBoostCredits,
                              })
                            : "-"
                        }
                      />
                      <FeatureRow
                        label={t("detailedAnalytics")}
                        value={plan.hasDetailedAnalytics}
                        isBoolean
                      />
                      <FeatureRow
                        label={t("prioritySupport")}
                        value={plan.hasPrioritySupport}
                        isBoolean
                      />
                      <FeatureRow
                        label={t("featuredBadge")}
                        value={plan.hasFeaturedBadge}
                        isBoolean
                      />
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      {isAuthenticated ? (
                        <Button
                          className="w-full"
                          variant={isPopular ? "default" : "outline"}
                          asChild
                        >
                          <Link href="/dashboard/subscription">
                            {plan.tier === 0
                              ? t("getStarted")
                              : t("upgrade")}
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant={isPopular ? "default" : "outline"}
                          asChild
                        >
                          <Link href="/login">
                            {t("getStarted")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <SimpleFooter />
    </div>
  );
}
