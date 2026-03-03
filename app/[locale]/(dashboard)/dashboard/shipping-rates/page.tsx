"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useRoles } from "@/hooks/useRoles";
import { useShippingRates } from "@/hooks/queries/useShipping";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  DollarSign,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  Truck,
  MapPin,
  Package,
} from "lucide-react";

interface PickItem {
  id: string;
  name: string;
}

interface CarrierPickItem {
  id: string;
  name: string;
  code: string;
}

interface RateFormData {
  shippingZoneId: string;
  shippingCarrierId: string;
  minWeight: string;
  maxWeight: string;
  minOrderAmount: string;
  shippingCost: string;
  currency: string;
  estimatedDeliveryDays: string;
  isFreeShipping: boolean;
  isActive: boolean;
}

const emptyForm: RateFormData = {
  shippingZoneId: "",
  shippingCarrierId: "",
  minWeight: "",
  maxWeight: "",
  minOrderAmount: "",
  shippingCost: "0",
  currency: "USD",
  estimatedDeliveryDays: "",
  isFreeShipping: false,
  isActive: true,
};

export default function ShippingRatesPage() {
  const t = useTranslations("shippingRates");
  const tc = useTranslations("common");
  const { isAdmin, isStaff } = useRoles();

  const queryClient = useQueryClient();
  const { data: rates = [], isLoading } = useShippingRates();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RateFormData>(emptyForm);

  const [zonePicks, setZonePicks] = useState<PickItem[]>([]);
  const [carrierPicks, setCarrierPicks] = useState<CarrierPickItem[]>([]);

  // Fetch zone and carrier picks when form opens
  useEffect(() => {
    if (showForm) {
      LivestockTradingAPI.ShippingZones.Pick.Request({
        selectedIds: [],
        keyword: "",
        limit: 50,
      }).then((data) =>
        setZonePicks(data.map((z) => ({ id: z.id, name: z.name })))
      ).catch(() => {});

      LivestockTradingAPI.ShippingCarriers.Pick.Request({
        selectedIds: [],
        keyword: "",
        limit: 50,
      }).then((data) =>
        setCarrierPicks(
          data.map((c) => ({ id: c.id, name: c.name, code: c.code }))
        )
      ).catch(() => {});
    }
  }, [showForm]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (rateId: string) => {
    try {
      const detail = await LivestockTradingAPI.ShippingRates.Detail.Request({
        id: rateId,
      });
      setFormData({
        shippingZoneId: detail.shippingZoneId || "",
        shippingCarrierId: detail.shippingCarrierId || "",
        minWeight: detail.minWeight != null ? String(detail.minWeight) : "",
        maxWeight: detail.maxWeight != null ? String(detail.maxWeight) : "",
        minOrderAmount:
          detail.minOrderAmount != null
            ? String(detail.minOrderAmount)
            : "",
        shippingCost: String(detail.shippingCost ?? 0),
        currency: detail.currency || "USD",
        estimatedDeliveryDays:
          detail.estimatedDeliveryDays != null
            ? String(detail.estimatedDeliveryDays)
            : "",
        isFreeShipping: detail.isFreeShipping,
        isActive: detail.isActive,
      });
      setEditingId(rateId);
      setShowForm(true);
    } catch {
      toast.error(t("fetchError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        shippingZoneId: formData.shippingZoneId,
        shippingCarrierId: formData.shippingCarrierId || undefined,
        minWeight: formData.minWeight
          ? parseFloat(formData.minWeight)
          : undefined,
        maxWeight: formData.maxWeight
          ? parseFloat(formData.maxWeight)
          : undefined,
        minOrderAmount: formData.minOrderAmount
          ? parseFloat(formData.minOrderAmount)
          : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shippingCost: parseFloat(formData.shippingCost || "0") as any,
        currency: formData.currency,
        estimatedDeliveryDays: formData.estimatedDeliveryDays
          ? parseInt(formData.estimatedDeliveryDays, 10)
          : undefined,
        isFreeShipping: formData.isFreeShipping,
        isActive: formData.isActive,
      };

      if (editingId) {
        await LivestockTradingAPI.ShippingRates.Update.Request({
          id: editingId,
          ...payload,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        toast.success(t("updateSuccess"));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await LivestockTradingAPI.ShippingRates.Create.Request(payload as any);
        toast.success(t("createSuccess"));
      }
      resetForm();
      queryClient.invalidateQueries({
        queryKey: queryKeys.shippingRates.all,
      });
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rateId: string) => {
    try {
      await LivestockTradingAPI.ShippingRates.Delete.Request({ id: rateId });
      queryClient.invalidateQueries({
        queryKey: queryKeys.shippingRates.all,
      });
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  // Helpers to display zone/carrier names from picks or rate data
  const getZoneName = (zoneId: string) => {
    const pick = zonePicks.find((z) => z.id === zoneId);
    return pick?.name || zoneId.slice(0, 8) + "...";
  };

  const getCarrierName = (carrierId?: string) => {
    if (!carrierId) return "-";
    const pick = carrierPicks.find((c) => c.id === carrierId);
    return pick?.name || carrierId.slice(0, 8) + "...";
  };

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{tc("unauthorized")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addRate")}
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editRate") : t("addRate")}
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("zone")}</Label>
                    <Select
                      value={formData.shippingZoneId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, shippingZoneId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("selectZone")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {zonePicks.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("carrier")}</Label>
                    <Select
                      value={formData.shippingCarrierId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, shippingCarrierId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("selectCarrier")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {carrierPicks.map((carrier) => (
                          <SelectItem key={carrier.id} value={carrier.id}>
                            {carrier.name} ({carrier.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rate-cost">{t("shippingCost")}</Label>
                    <Input
                      id="rate-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shippingCost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingCost: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate-currency">{t("currency")}</Label>
                    <Input
                      id="rate-currency"
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currency: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="USD"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate-delivery">
                      {t("estimatedDeliveryDays")}
                    </Label>
                    <Input
                      id="rate-delivery"
                      type="number"
                      min="0"
                      value={formData.estimatedDeliveryDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedDeliveryDays: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rate-min-weight">{t("minWeight")}</Label>
                    <Input
                      id="rate-min-weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minWeight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minWeight: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate-max-weight">{t("maxWeight")}</Label>
                    <Input
                      id="rate-max-weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxWeight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxWeight: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate-min-order">
                      {t("minOrderAmount")}
                    </Label>
                    <Input
                      id="rate-min-order"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minOrderAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minOrderAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="rate-free"
                      checked={formData.isFreeShipping}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isFreeShipping: checked })
                      }
                    />
                    <Label htmlFor="rate-free">{t("freeShipping")}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="rate-active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <Label htmlFor="rate-active">{t("active")}</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {tc("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? t("saving") : tc("save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : rates.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noRates")}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_100px_80px_80px_60px] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
              <div>{t("zone")}</div>
              <div>{t("carrier")}</div>
              <div className="text-right">{t("cost")}</div>
              <div className="text-center">{t("deliveryDays")}</div>
              <div className="text-center">{t("freeShipping")}</div>
              <div className="text-center">{t("status")}</div>
              <div></div>
            </div>

            {/* Table Body */}
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_100px_80px_80px_60px] gap-2 md:gap-4 px-4 py-3 border-t items-center hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground hidden md:block" />
                  <span className="text-sm font-medium">
                    {getZoneName(rate.shippingZoneId)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground hidden md:block" />
                  <span className="text-sm">
                    {getCarrierName(rate.shippingCarrierId ?? undefined)}
                  </span>
                </div>

                <div className="text-right text-sm font-medium">
                  <span className="md:hidden text-muted-foreground mr-1">
                    {t("cost")}:
                  </span>
                  {rate.shippingCost} {rate.currency}
                </div>

                <div className="text-center text-sm">
                  <span className="md:hidden text-muted-foreground mr-1">
                    {t("deliveryDays")}:
                  </span>
                  {rate.estimatedDeliveryDays
                    ? `${rate.estimatedDeliveryDays}d`
                    : "-"}
                </div>

                <div className="text-center">
                  {rate.isFreeShipping && (
                    <Badge variant="default" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      {t("free")}
                    </Badge>
                  )}
                </div>

                <div className="text-center">
                  <Badge
                    variant={rate.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {rate.isActive ? t("active") : t("inactive")}
                  </Badge>
                </div>

                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(rate.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(rate.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
