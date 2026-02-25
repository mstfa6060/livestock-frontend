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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  X,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  email: string;
  type: number;
  isActive: boolean;
}

const LocationType = {
  Pickup: 0,
  Delivery: 1,
  Both: 2,
} as const;

export default function LocationsPage() {
  const t = useTranslations("locations");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: locationsRaw = [], isLoading } = useQuery({
    queryKey: queryKeys.locations.list({ userId: user?.id }),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Locations.All.Request({
        sorting: {
          key: "createdAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [
          {
            key: "userId",
            type: "guid",
            isUsed: true,
            values: [user!.id],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      });

      return response.map((l) => ({
        id: l.id,
        name: l.name,
        addressLine1: l.addressLine1,
        addressLine2: l.addressLine2,
        city: l.city,
        state: l.state,
        postalCode: l.postalCode,
        countryCode: l.countryCode,
        phone: l.phone,
        email: l.email,
        type: l.type,
        isActive: l.isActive,
      })) as Location[];
    },
    enabled: !!user?.id,
  });

  const locations = locationsRaw;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: "TR",
    phone: "",
    email: "",
    type: 2,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: "TR",
      phone: "",
      email: "",
      type: 2,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (loc: Location) => {
    setFormData({
      name: loc.name,
      addressLine1: loc.addressLine1,
      addressLine2: loc.addressLine2,
      city: loc.city,
      state: loc.state,
      postalCode: loc.postalCode,
      countryCode: loc.countryCode,
      phone: loc.phone,
      email: loc.email,
      type: loc.type,
    });
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await LivestockTradingAPI.Locations.Update.Request({
          id: editingId,
          ...formData,
          isActive: true,
          userId: user.id,
        });
        toast.success(t("updateSuccess"));
      } else {
        await LivestockTradingAPI.Locations.Create.Request({
          ...formData,
          isActive: true,
          userId: user.id,
        });
        toast.success(t("createSuccess"));
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.list({ userId: user?.id }) });
    } catch {
      toast.error(editingId ? t("updateError") : t("createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await LivestockTradingAPI.Locations.Delete.Request({ id });
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.list({ userId: user?.id }) });
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const getTypeLabel = (type: number) => {
    switch (type) {
      case LocationType.Pickup:
        return t("typePickup");
      case LocationType.Delivery:
        return t("typeDelivery");
      case LocationType.Both:
        return t("typeBoth");
      default:
        return t("typeBoth");
    }
  };

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
              <Plus className="h-4 w-4 mr-2" />
              {t("addLocation")}
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editLocation") : t("addLocation")}
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t("namePlaceholder")}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address1">{t("address")}</Label>
                    <Input
                      id="address1"
                      value={formData.addressLine1}
                      onChange={(e) =>
                        setFormData({ ...formData, addressLine1: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address2">{t("addressLine2")}</Label>
                    <Input
                      id="address2"
                      value={formData.addressLine2}
                      onChange={(e) =>
                        setFormData({ ...formData, addressLine2: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">{t("city")}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">{t("state")}</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">{t("postalCode")}</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("saving")}
                      </>
                    ) : (
                      t("save")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Locations List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noLocations")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((loc) => (
              <Card key={loc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <p className="font-medium">{loc.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(loc.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {loc.addressLine1}
                        {loc.addressLine2 && `, ${loc.addressLine2}`}
                      </p>
                      <p className="text-sm text-muted-foreground ml-6">
                        {loc.city}
                        {loc.state && `, ${loc.state}`}
                        {loc.postalCode && ` ${loc.postalCode}`}
                        {" - "}
                        {loc.countryCode}
                      </p>
                      {(loc.phone || loc.email) && (
                        <p className="text-xs text-muted-foreground ml-6 mt-1">
                          {loc.phone && loc.phone}
                          {loc.phone && loc.email && " | "}
                          {loc.email && loc.email}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(loc)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(loc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
