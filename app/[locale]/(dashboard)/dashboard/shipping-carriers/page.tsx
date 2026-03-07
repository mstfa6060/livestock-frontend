"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useRoles } from "@/hooks/useRoles";
import { useShippingCarriers } from "@/hooks/queries/useShipping";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  Truck,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  Globe,
  ExternalLink,
} from "lucide-react";

interface CarrierFormData {
  name: string;
  code: string;
  website: string;
  trackingUrlTemplate: string;
  isActive: boolean;
  supportedCountries: string;
}

const emptyForm: CarrierFormData = {
  name: "",
  code: "",
  website: "",
  trackingUrlTemplate: "",
  isActive: true,
  supportedCountries: "",
};

export default function ShippingCarriersPage() {
  const t = useTranslations("shippingCarriers");
  const tc = useTranslations("common");
  const { isAdmin, isStaff } = useRoles();

  const queryClient = useQueryClient();
  const { data: carriers = [], isLoading } = useShippingCarriers();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CarrierFormData>(emptyForm);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (carrierId: string) => {
    try {
      const detail = await LivestockTradingAPI.ShippingCarriers.Detail.Request({
        id: carrierId,
      });
      setFormData({
        name: detail.name,
        code: detail.code,
        website: detail.website || "",
        trackingUrlTemplate: detail.trackingUrlTemplate || "",
        isActive: detail.isActive,
        supportedCountries: detail.supportedCountries || "",
      });
      setEditingId(carrierId);
      setShowForm(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("fetchError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await LivestockTradingAPI.ShippingCarriers.Update.Request({
          id: editingId,
          ...formData,
        });
        toast.success(t("updateSuccess"));
      } else {
        await LivestockTradingAPI.ShippingCarriers.Create.Request(formData);
        toast.success(t("createSuccess"));
      }
      resetForm();
      queryClient.invalidateQueries({
        queryKey: queryKeys.shippingCarriers.all,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (carrierId: string) => {
    try {
      await LivestockTradingAPI.ShippingCarriers.Delete.Request({
        id: carrierId,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.shippingCarriers.all,
      });
      toast.success(t("deleteSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteError"));
    }
  };

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
              <Truck className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addCarrier")}
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editCarrier") : t("addCarrier")}
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="carrier-name">{t("carrierName")}</Label>
                    <Input
                      id="carrier-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("carrierNamePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier-code">{t("code")}</Label>
                    <Input
                      id="carrier-code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder={t("codePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier-website">{t("website")}</Label>
                    <Input
                      id="carrier-website"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier-tracking">
                      {t("trackingUrlTemplate")}
                    </Label>
                    <Input
                      id="carrier-tracking"
                      value={formData.trackingUrlTemplate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          trackingUrlTemplate: e.target.value,
                        })
                      }
                      placeholder={t("trackingUrlPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="carrier-countries">
                    {t("supportedCountries")}
                  </Label>
                  <Input
                    id="carrier-countries"
                    value={formData.supportedCountries}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supportedCountries: e.target.value,
                      })
                    }
                    placeholder={t("supportedCountriesPlaceholder")}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="carrier-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="carrier-active">{t("active")}</Label>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : carriers.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noCarriers")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carriers.map((carrier) => (
              <Card key={carrier.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{carrier.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {carrier.code}
                      </p>
                    </div>
                    <Badge
                      variant={carrier.isActive ? "default" : "secondary"}
                    >
                      {carrier.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </div>

                  {carrier.website && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{carrier.website}</span>
                    </div>
                  )}

                  {carrier.supportedCountries && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">
                        {carrier.supportedCountries}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(carrier.id)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(carrier.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t("delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
