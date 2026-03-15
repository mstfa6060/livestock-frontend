"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoostPackages, useCreateProductBoost } from "@/hooks/queries/useBoost";
import { Zap, Clock, Star, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BoostPackageDialogProps {
  productId: string;
  sellerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// BoostType: 0=Daily, 1=Weekly, 2=Mega
const BOOST_TYPE_ICONS: Record<number, typeof Zap> = {
  0: Clock,
  1: Star,
  2: Zap,
};

const BOOST_TYPE_COLORS: Record<number, string> = {
  0: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30",
  1: "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30",
  2: "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30",
};

const BOOST_TYPE_BADGE_COLORS: Record<number, string> = {
  0: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  1: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  2: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

function formatDuration(hours: number, t: ReturnType<typeof useTranslations>) {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return t("days", { count: days });
  }
  return t("hours", { count: hours });
}

export function BoostPackageDialog({
  productId,
  sellerId,
  open,
  onOpenChange,
}: BoostPackageDialogProps) {
  const t = useTranslations("boost");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const { data: packages, isLoading } = useBoostPackages(locale);
  const createBoost = useCreateProductBoost();

  const activePackages = packages?.filter((p) => p.isActive) ?? [];

  const handlePurchase = async () => {
    if (!selectedPackageId) return;

    // For web platform, show mobile app message
    toast.info(t("availableOnMobile"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {t("boostProduct")}
          </DialogTitle>
          <DialogDescription>{t("selectPackage")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </>
          ) : activePackages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("noBoosts")}
            </p>
          ) : (
            activePackages.map((pkg) => {
              const Icon = BOOST_TYPE_ICONS[pkg.boostType] ?? Zap;
              const isSelected = selectedPackageId === pkg.id;
              const colorClass = BOOST_TYPE_COLORS[pkg.boostType] ?? "";
              const badgeColor = BOOST_TYPE_BADGE_COLORS[pkg.boostType] ?? "";

              return (
                <Card
                  key={pkg.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    colorClass,
                    isSelected && "ring-2 ring-primary shadow-md"
                  )}
                  onClick={() => setSelectedPackageId(pkg.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background shadow-sm">
                          <Icon className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{pkg.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pkg.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className={cn("text-xs", badgeColor)}>
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(pkg.durationHours, t)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {t("boostScore")}: {pkg.boostScore}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {typeof pkg.price === "number" ? pkg.price.toFixed(2) : pkg.price}
                        </p>
                        <p className="text-xs text-muted-foreground">{pkg.currency}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Web platform notice */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground mt-2">
          <Smartphone className="h-4 w-4 shrink-0" />
          <p>{t("availableOnMobile")}</p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("close")}
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!selectedPackageId || createBoost.isPending}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-white border-0"
          >
            <Zap className="h-4 w-4 mr-2" />
            {t("purchase")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
