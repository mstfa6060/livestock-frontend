"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useRoles } from "@/hooks/useRoles";
import {
  useSubscriptionPlans,
  useUpdateSubscriptionPlan,
} from "@/hooks/queries/useSubscription";
import { toast } from "sonner";
import {
  CreditCard,
  Edit,
  Save,
  ShieldAlert,
  Crown,
  Check,
  X,
} from "lucide-react";

const TIER_LABELS: Record<number, string> = {
  0: "Free",
  1: "Basic",
  2: "Pro",
  3: "Business",
};

const TIER_COLORS: Record<number, string> = {
  0: "bg-gray-100 text-gray-700 border-gray-300",
  1: "bg-blue-100 text-blue-700 border-blue-300",
  2: "bg-purple-100 text-purple-700 border-purple-300",
  3: "bg-amber-100 text-amber-700 border-amber-300",
};

interface PlanFormData {
  id: string;
  name: string;
  description: string;
  nameTranslations: string;
  descriptionTranslations: string;
  targetType: number;
  tier: number;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  appleProductIdMonthly: string;
  appleProductIdYearly: string;
  googleProductIdMonthly: string;
  googleProductIdYearly: string;
  maxActiveListings: number;
  maxPhotosPerListing: number;
  monthlyBoostCredits: number;
  hasDetailedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasFeaturedBadge: boolean;
  sortOrder: number;
  isActive: boolean;
}

export default function SubscriptionPlansAdminPage() {
  const t = useTranslations("admin");
  const { isAdmin, isStaff } = useRoles();

  const { data: plans = [], isLoading } = useSubscriptionPlans("en");
  const updateMutation = useUpdateSubscriptionPlan();

  const [editingPlan, setEditingPlan] = useState<PlanFormData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleEdit = (plan: (typeof plans)[0]) => {
    setEditingPlan({
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      nameTranslations: (plan as any).nameTranslations || "",
      descriptionTranslations: (plan as any).descriptionTranslations || "",
      targetType: plan.targetType,
      tier: plan.tier,
      priceMonthly: Number(plan.priceMonthly) || 0,
      priceYearly: Number(plan.priceYearly) || 0,
      currency: plan.currency || "USD",
      appleProductIdMonthly: plan.appleProductIdMonthly || "",
      appleProductIdYearly: plan.appleProductIdYearly || "",
      googleProductIdMonthly: plan.googleProductIdMonthly || "",
      googleProductIdYearly: plan.googleProductIdYearly || "",
      maxActiveListings: plan.maxActiveListings,
      maxPhotosPerListing: plan.maxPhotosPerListing,
      monthlyBoostCredits: plan.monthlyBoostCredits,
      hasDetailedAnalytics: plan.hasDetailedAnalytics,
      hasPrioritySupport: plan.hasPrioritySupport,
      hasFeaturedBadge: plan.hasFeaturedBadge,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      await updateMutation.mutateAsync(editingPlan);
      toast.success(t("updateSuccess"));
      setSheetOpen(false);
      setEditingPlan(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("updateError")
      );
    }
  };

  const formatPrice = (price: number | unknown) => {
    const num = Number(price) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("unauthorized")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            {t("subscriptionPlans")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subscriptionPlansDescription")}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noPlans")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">{t("planName")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("tier")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("monthlyPrice")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("yearlyPrice")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("maxListings")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("maxPhotos")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("boostCredits")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("status")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{plan.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TIER_COLORS[plan.tier] || TIER_COLORS[0]}`}>
                        {TIER_LABELS[plan.tier] || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(plan.priceMonthly)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(plan.priceYearly)}
                    </td>
                    <td className="px-4 py-3 text-center">{plan.maxActiveListings}</td>
                    <td className="px-4 py-3 text-center">{plan.maxPhotosPerListing}</td>
                    <td className="px-4 py-3 text-center">{plan.monthlyBoostCredits}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={plan.isActive ? "default" : "destructive"}>
                        {plan.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {t("edit")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("editPlan")}</SheetTitle>
            <SheetDescription>{t("editPlanDescription")}</SheetDescription>
          </SheetHeader>

          {editingPlan && (
            <div className="space-y-6 mt-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("basicInfo")}
                </h3>
                <div>
                  <Label htmlFor="plan-name">{t("planName")}</Label>
                  <Input
                    id="plan-name"
                    value={editingPlan.name}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="plan-desc">{t("description")}</Label>
                  <Textarea
                    id="plan-desc"
                    value={editingPlan.description}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="plan-sort">{t("sortOrder")}</Label>
                  <Input
                    id="plan-sort"
                    type="number"
                    value={editingPlan.sortOrder}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, sortOrder: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("pricing")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan-monthly">{t("monthlyPrice")} (USD)</Label>
                    <Input
                      id="plan-monthly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPlan.priceMonthly}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          priceMonthly: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-yearly">{t("yearlyPrice")} (USD)</Label>
                    <Input
                      id="plan-yearly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPlan.priceYearly}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          priceYearly: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("limits")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="plan-listings">{t("maxListings")}</Label>
                    <Input
                      id="plan-listings"
                      type="number"
                      min="0"
                      value={editingPlan.maxActiveListings}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          maxActiveListings: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-photos">{t("maxPhotos")}</Label>
                    <Input
                      id="plan-photos"
                      type="number"
                      min="0"
                      value={editingPlan.maxPhotosPerListing}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          maxPhotosPerListing: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-boosts">{t("boostCredits")}</Label>
                    <Input
                      id="plan-boosts"
                      type="number"
                      min="0"
                      value={editingPlan.monthlyBoostCredits}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          monthlyBoostCredits: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("features")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="plan-analytics" className="cursor-pointer">
                      {t("detailedAnalytics")}
                    </Label>
                    <Switch
                      id="plan-analytics"
                      checked={editingPlan.hasDetailedAnalytics}
                      onCheckedChange={(checked) =>
                        setEditingPlan({ ...editingPlan, hasDetailedAnalytics: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="plan-support" className="cursor-pointer">
                      {t("prioritySupport")}
                    </Label>
                    <Switch
                      id="plan-support"
                      checked={editingPlan.hasPrioritySupport}
                      onCheckedChange={(checked) =>
                        setEditingPlan({ ...editingPlan, hasPrioritySupport: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="plan-badge" className="cursor-pointer">
                      {t("featuredBadge")}
                    </Label>
                    <Switch
                      id="plan-badge"
                      checked={editingPlan.hasFeaturedBadge}
                      onCheckedChange={(checked) =>
                        setEditingPlan({ ...editingPlan, hasFeaturedBadge: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Store Product IDs */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("storeProductIds")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan-apple-monthly">{t("appleMonthly")}</Label>
                    <Input
                      id="plan-apple-monthly"
                      value={editingPlan.appleProductIdMonthly}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          appleProductIdMonthly: e.target.value,
                        })
                      }
                      placeholder="com.app.sub.monthly"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-apple-yearly">{t("appleYearly")}</Label>
                    <Input
                      id="plan-apple-yearly"
                      value={editingPlan.appleProductIdYearly}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          appleProductIdYearly: e.target.value,
                        })
                      }
                      placeholder="com.app.sub.yearly"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-google-monthly">{t("googleMonthly")}</Label>
                    <Input
                      id="plan-google-monthly"
                      value={editingPlan.googleProductIdMonthly}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          googleProductIdMonthly: e.target.value,
                        })
                      }
                      placeholder="sub_monthly"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-google-yearly">{t("googleYearly")}</Label>
                    <Input
                      id="plan-google-yearly"
                      value={editingPlan.googleProductIdYearly}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          googleProductIdYearly: e.target.value,
                        })
                      }
                      placeholder="sub_yearly"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("status")}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingPlan.isActive ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <Label htmlFor="plan-active" className="cursor-pointer">
                      {editingPlan.isActive ? t("active") : t("inactive")}
                    </Label>
                  </div>
                  <Switch
                    id="plan-active"
                    checked={editingPlan.isActive}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, isActive: checked })
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSheetOpen(false);
                    setEditingPlan(null);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? t("saving") : t("save")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
