"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductBoosts } from "@/hooks/queries/useBoost";
import { useSellerByUserId } from "@/hooks/queries";
import { useAuth } from "@/contexts/AuthContext";
import { BoostPackageDialog } from "@/components/features/boost-package-dialog";
import { Zap, Clock, RotateCw, Package } from "lucide-react";

function formatTimeRemaining(expiresAt: Date | string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return "";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}g ${remainingHours}s`;
  }

  return `${hours}s ${minutes}dk`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BoostCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BoostsPage() {
  const t = useTranslations("boost");
  const tc = useTranslations("common");
  const { user } = useAuth();

  const { data: sellerData } = useSellerByUserId(user?.id ?? "", {
    enabled: !!user?.id,
  });
  const sellerId = sellerData?.id ?? "";

  const [page, setPage] = useState(1);
  const { data: boosts, isLoading } = useProductBoosts(sellerId, page);

  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [boostProductId, setBoostProductId] = useState<string>("");

  const boostList = boosts ?? [];
  const activeBoosts = boostList.filter((b) => b.isActive && !b.isExpired);
  const expiredBoosts = boostList.filter((b) => b.isExpired || !b.isActive);

  const handleBoostAgain = (productId: string) => {
    setBoostProductId(productId);
    setBoostDialogOpen(true);
  };

  return (
    <DashboardLayout title={t("title")} description={t("boostHistory")}>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <BoostCardSkeleton key={i} />
          ))}
        </div>
      ) : boostList.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Zap className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg mb-2">{t("noBoosts")}</p>
          <p className="text-muted-foreground text-sm mb-6">{t("noBoostsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Boosts */}
          {activeBoosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                {t("activeBoosts")}
              </h2>
              <div className="space-y-3">
                {activeBoosts.map((boost) => (
                  <Card key={boost.id} className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                            <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{boost.productTitle}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {boost.boostPackageName}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0 text-xs">
                                {t("active")}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {t("expiresIn", { time: formatTimeRemaining(boost.expiresAt) })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(boost.startedAt)} - {formatDate(boost.expiresAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs self-start sm:self-center">
                          +{boost.boostScore}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Expired Boosts */}
          {expiredBoosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                {t("expiredBoosts")}
              </h2>
              <div className="space-y-3">
                {expiredBoosts.map((boost) => (
                  <Card key={boost.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{boost.productTitle}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {boost.boostPackageName}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {t("expired")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(boost.startedAt)} - {formatDate(boost.expiresAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBoostAgain(boost.productId)}
                          className="self-start sm:self-center"
                        >
                          <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                          {t("boostAgain")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              {tc("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={boostList.length < 20}
            >
              {tc("next")}
            </Button>
          </div>
        </div>
      )}

      {/* Boost Dialog */}
      {boostProductId && (
        <BoostPackageDialog
          productId={boostProductId}
          sellerId={sellerId}
          open={boostDialogOpen}
          onOpenChange={setBoostDialogOpen}
        />
      )}
    </DashboardLayout>
  );
}
