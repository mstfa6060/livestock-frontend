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
  useBoostPackages,
  useUpdateBoostPackage,
} from "@/hooks/queries/useBoost";
import { toast } from "sonner";
import {
  Zap,
  Edit,
  Save,
  ShieldAlert,
  Check,
  X,
  Clock,
  TrendingUp,
} from "lucide-react";

const BOOST_TYPE_LABELS: Record<number, string> = {
  0: "Daily",
  1: "Weekly",
  2: "Mega",
};

const BOOST_TYPE_COLORS: Record<number, string> = {
  0: "bg-blue-100 text-blue-700 border-blue-300",
  1: "bg-purple-100 text-purple-700 border-purple-300",
  2: "bg-amber-100 text-amber-700 border-amber-300",
};

interface PackageFormData {
  id: string;
  name: string;
  description: string;
  durationHours: number;
  price: number;
  currency: string;
  appleProductId: string;
  googleProductId: string;
  boostType: number;
  boostScore: number;
  sortOrder: number;
  isActive: boolean;
}

export default function BoostPackagesAdminPage() {
  const t = useTranslations("admin");
  const { isAdmin, isStaff } = useRoles();

  const { data: packages = [], isLoading } = useBoostPackages("en");
  const updateMutation = useUpdateBoostPackage();

  const [editingPackage, setEditingPackage] = useState<PackageFormData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleEdit = (pkg: (typeof packages)[0]) => {
    setEditingPackage({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || "",
      durationHours: pkg.durationHours,
      price: Number(pkg.price) || 0,
      currency: pkg.currency || "USD",
      appleProductId: pkg.appleProductId || "",
      googleProductId: pkg.googleProductId || "",
      boostType: pkg.boostType,
      boostScore: pkg.boostScore,
      sortOrder: pkg.sortOrder,
      isActive: pkg.isActive,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editingPackage) return;

    try {
      await updateMutation.mutateAsync(editingPackage);
      toast.success(t("updateSuccess"));
      setSheetOpen(false);
      setEditingPackage(null);
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

  const formatDuration = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d`;
    }
    return `${hours}h`;
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
            <Zap className="h-6 w-6" />
            {t("boostPackages")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("boostPackagesDescription")}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noPackages")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">{t("packageName")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("boostType")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("duration")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("price")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("boostScoreLabel")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("status")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{pkg.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${BOOST_TYPE_COLORS[pkg.boostType] || BOOST_TYPE_COLORS[0]}`}>
                        {BOOST_TYPE_LABELS[pkg.boostType] || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDuration(pkg.durationHours)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(pkg.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span>{pkg.boostScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={pkg.isActive ? "default" : "destructive"}>
                        {pkg.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(pkg)}
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
            <SheetTitle>{t("editPackage")}</SheetTitle>
            <SheetDescription>{t("editPackageDescription")}</SheetDescription>
          </SheetHeader>

          {editingPackage && (
            <div className="space-y-6 mt-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("basicInfo")}
                </h3>
                <div>
                  <Label htmlFor="pkg-name">{t("packageName")}</Label>
                  <Input
                    id="pkg-name"
                    value={editingPackage.name}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="pkg-desc">{t("description")}</Label>
                  <Textarea
                    id="pkg-desc"
                    value={editingPackage.description}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="pkg-sort">{t("sortOrder")}</Label>
                  <Input
                    id="pkg-sort"
                    type="number"
                    value={editingPackage.sortOrder}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, sortOrder: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {/* Boost Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("boostSettings")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pkg-duration">{t("durationHours")}</Label>
                    <Input
                      id="pkg-duration"
                      type="number"
                      min="1"
                      value={editingPackage.durationHours}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          durationHours: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pkg-score">{t("boostScoreLabel")}</Label>
                    <Input
                      id="pkg-score"
                      type="number"
                      min="0"
                      value={editingPackage.boostScore}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          boostScore: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pkg-price">{t("price")} (USD)</Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPackage.price}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {/* Store Product IDs */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("storeProductIds")}
                </h3>
                <div>
                  <Label htmlFor="pkg-apple">{t("appleProductId")}</Label>
                  <Input
                    id="pkg-apple"
                    value={editingPackage.appleProductId}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        appleProductId: e.target.value,
                      })
                    }
                    placeholder="com.app.boost.daily"
                  />
                </div>
                <div>
                  <Label htmlFor="pkg-google">{t("googleProductId")}</Label>
                  <Input
                    id="pkg-google"
                    value={editingPackage.googleProductId}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        googleProductId: e.target.value,
                      })
                    }
                    placeholder="boost_daily"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("status")}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingPackage.isActive ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <Label htmlFor="pkg-active" className="cursor-pointer">
                      {editingPackage.isActive ? t("active") : t("inactive")}
                    </Label>
                  </div>
                  <Switch
                    id="pkg-active"
                    checked={editingPackage.isActive}
                    onCheckedChange={(checked) =>
                      setEditingPackage({ ...editingPackage, isActive: checked })
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
                    setEditingPackage(null);
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
