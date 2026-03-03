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
import { useShippingZones } from "@/hooks/queries/useShipping";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  MapPin,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  Globe,
} from "lucide-react";

interface ZoneFormData {
  name: string;
  countryCodes: string;
  isActive: boolean;
}

const emptyForm: ZoneFormData = {
  name: "",
  countryCodes: "",
  isActive: true,
};

export default function ShippingZonesPage() {
  const t = useTranslations("shippingZones");
  const tc = useTranslations("common");
  const { isAdmin, isStaff } = useRoles();

  const queryClient = useQueryClient();
  const { data: zones = [], isLoading } = useShippingZones();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ZoneFormData>(emptyForm);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (zoneId: string) => {
    try {
      const detail = await LivestockTradingAPI.ShippingZones.Detail.Request({
        id: zoneId,
      });
      setFormData({
        name: detail.name,
        countryCodes: detail.countryCodes || "",
        isActive: detail.isActive,
      });
      setEditingId(zoneId);
      setShowForm(true);
    } catch {
      toast.error(t("fetchError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await LivestockTradingAPI.ShippingZones.Update.Request({
          id: editingId,
          name: formData.name,
          countryCodes: formData.countryCodes,
          isActive: formData.isActive,
        });
        toast.success(t("updateSuccess"));
      } else {
        await LivestockTradingAPI.ShippingZones.Create.Request({
          name: formData.name,
          countryCodes: formData.countryCodes,
          isActive: formData.isActive,
        });
        toast.success(t("createSuccess"));
      }
      resetForm();
      queryClient.invalidateQueries({
        queryKey: queryKeys.shippingZones.all,
      });
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (zoneId: string) => {
    try {
      await LivestockTradingAPI.ShippingZones.Delete.Request({ id: zoneId });
      queryClient.invalidateQueries({
        queryKey: queryKeys.shippingZones.all,
      });
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
              <MapPin className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addZone")}
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editZone") : t("addZone")}
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zone-name">{t("zoneName")}</Label>
                    <Input
                      id="zone-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("zoneNamePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone-countries">
                      {t("countryCodes")}
                    </Label>
                    <Input
                      id="zone-countries"
                      value={formData.countryCodes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          countryCodes: e.target.value,
                        })
                      }
                      placeholder={t("countryCodesPlaceholder")}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="zone-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="zone-active">{t("active")}</Label>
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
        ) : zones.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noZones")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <Card key={zone.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{zone.name}</h3>
                    <Badge
                      variant={zone.isActive ? "default" : "secondary"}
                    >
                      {zone.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </div>

                  {zone.countryCodes && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{zone.countryCodes}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(zone.id)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(zone.id)}
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
