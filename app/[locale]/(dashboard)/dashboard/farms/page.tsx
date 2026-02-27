"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { farmFormSchema, type FarmFormData } from "@/lib/validations";
import {
  Tractor,
  PlusCircle,
  MapPin,
  Leaf,
  BadgeCheck,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";

const FarmType = {
  Livestock: 0,
  Crop: 1,
  Mixed: 2,
  Poultry: 3,
  Dairy: 4,
  Aquaculture: 5,
} as const;

interface Farm {
  id: string;
  name: string;
  description: string;
  registrationNumber: string;
  sellerId: string;
  locationId: string;
  type: number;
  totalAreaHectares?: number;
  isOrganic: boolean;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

function getFarmTypeLabel(type: number, t: (key: string) => string) {
  switch (type) {
    case FarmType.Livestock: return t("farmType.livestock");
    case FarmType.Crop: return t("farmType.crop");
    case FarmType.Mixed: return t("farmType.mixed");
    case FarmType.Poultry: return t("farmType.poultry");
    case FarmType.Dairy: return t("farmType.dairy");
    case FarmType.Aquaculture: return t("farmType.aquaculture");
    default: return t("farmType.mixed");
  }
}

export default function FarmsPage() {
  const t = useTranslations("farms");
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch seller profile
  const { data: sellerProfile } = useQuery({
    queryKey: queryKeys.sellers.byUserId(user?.id ?? ""),
    queryFn: () => LivestockTradingAPI.Sellers.GetByUserId.Request({ userId: user!.id }),
    enabled: !!user?.id,
  });
  const sellerId = sellerProfile?.id ?? null;

  // Fetch farms for this seller
  const { data: farmsRaw = [], isLoading } = useQuery({
    queryKey: queryKeys.farms.list({ sellerId }),
    queryFn: async () => {
      const farmsResponse = await LivestockTradingAPI.Farms.All.Request({
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          {
            key: "sellerId",
            type: "guid",
            isUsed: true,
            values: [sellerId!],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      });

      return farmsResponse.map((f) => ({
        id: f.id,
        name: f.name,
        description: "",
        registrationNumber: "",
        sellerId: f.sellerId,
        locationId: f.locationId,
        type: f.type,
        totalAreaHectares: f.totalAreaHectares as number | undefined,
        isOrganic: f.isOrganic,
        isActive: f.isActive,
        isVerified: f.isVerified,
        createdAt: f.createdAt,
      })) as Farm[];
    },
    enabled: !!sellerId,
  });

  const farms = farmsRaw;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormValues: FarmFormData = {
    name: "",
    description: "",
    registrationNumber: "",
    type: FarmType.Livestock,
    totalAreaHectares: "",
    cultivatedAreaHectares: "",
    certifications: "",
    isOrganic: false,
  };

  const {
    register,
    handleSubmit: formSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmFormSchema),
    defaultValues: defaultFormValues,
  });

  const resetForm = () => {
    reset(defaultFormValues);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (farmId: string) => {
    try {
      const detail = await LivestockTradingAPI.Farms.Detail.Request({ id: farmId });
      reset({
        name: detail.name,
        description: detail.description || "",
        registrationNumber: detail.registrationNumber || "",
        type: detail.type,
        totalAreaHectares: detail.totalAreaHectares ? String(detail.totalAreaHectares) : "",
        cultivatedAreaHectares: detail.cultivatedAreaHectares ? String(detail.cultivatedAreaHectares) : "",
        certifications: detail.certifications || "",
        isOrganic: detail.isOrganic,
      });
      setEditingId(farmId);
      setShowForm(true);
    } catch {
      toast.error(t("fetchError"));
    }
  };

  const onSubmit = async (data: FarmFormData) => {
    if (!sellerId || !user?.id) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update
        const detail = await LivestockTradingAPI.Farms.Detail.Request({ id: editingId });
        await LivestockTradingAPI.Farms.Update.Request({
          id: editingId,
          name: data.name,
          description: data.description || "",
          registrationNumber: data.registrationNumber || "",
          sellerId,
          locationId: detail.locationId,
          type: data.type,
          totalAreaHectares: data.totalAreaHectares ? parseFloat(data.totalAreaHectares) : undefined,
          cultivatedAreaHectares: data.cultivatedAreaHectares ? parseFloat(data.cultivatedAreaHectares) : undefined,
          certifications: data.certifications || "",
          isOrganic: data.isOrganic,
          imageUrls: detail.imageUrls || "",
          videoUrl: detail.videoUrl || "",
          isActive: true,
          isVerified: detail.isVerified,
        });
        toast.success(t("updateSuccess"));
      } else {
        // Create
        await LivestockTradingAPI.Farms.Create.Request({
          name: data.name,
          description: data.description || "",
          registrationNumber: data.registrationNumber || "",
          sellerId,
          locationId: "00000000-0000-0000-0000-000000000000",
          type: data.type,
          totalAreaHectares: data.totalAreaHectares ? parseFloat(data.totalAreaHectares) : undefined,
          cultivatedAreaHectares: data.cultivatedAreaHectares ? parseFloat(data.cultivatedAreaHectares) : undefined,
          certifications: data.certifications || "",
          isOrganic: data.isOrganic,
          imageUrls: "",
          videoUrl: "",
          isActive: true,
        });
        toast.success(t("createSuccess"));
      }

      resetForm();

      queryClient.invalidateQueries({ queryKey: queryKeys.farms.list({ sellerId }) });
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (farmId: string) => {
    try {
      await LivestockTradingAPI.Farms.Delete.Request({ id: farmId });
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.list({ sellerId }) });
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!sellerId) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Tractor className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("sellerRequired")}</h2>
          <p className="text-muted-foreground mb-4">{t("sellerRequiredDesc")}</p>
          <Button asChild>
            <a href="/dashboard/become-seller">{t("becomeSeller")}</a>
          </Button>
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
              <Tractor className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addFarm")}
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editFarm") : t("addFarm")}
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="farm-name">{t("farmName")}</Label>
                    <Input
                      id="farm-name"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="farm-reg">{t("registrationNumber")}</Label>
                    <Input
                      id="farm-reg"
                      {...register("registrationNumber")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="farm-type">{t("farmTypeLabel")}</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FarmType).map(([key, value]) => (
                              <SelectItem key={key} value={String(value)}>
                                {getFarmTypeLabel(value, t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="farm-area">{t("totalArea")} (ha)</Label>
                    <Input
                      id="farm-area"
                      type="number"
                      step="0.01"
                      {...register("totalAreaHectares")}
                    />
                    {errors.totalAreaHectares && (
                      <p className="text-sm text-destructive mt-1">{errors.totalAreaHectares.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="farm-cultivated">{t("cultivatedArea")} (ha)</Label>
                    <Input
                      id="farm-cultivated"
                      type="number"
                      step="0.01"
                      {...register("cultivatedAreaHectares")}
                    />
                    {errors.cultivatedAreaHectares && (
                      <p className="text-sm text-destructive mt-1">{errors.cultivatedAreaHectares.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Controller
                      name="isOrganic"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="farm-organic"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="farm-organic">{t("organic")}</Label>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="farm-desc">{t("farmDescription")}</Label>
                  <Textarea
                    id="farm-desc"
                    {...register("description")}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="farm-certs">{t("certifications")}</Label>
                  <Input
                    id="farm-certs"
                    {...register("certifications")}
                    placeholder={t("certificationsPlaceholder")}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? t("saving") : t("save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Farms List */}
        {farms.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <Tractor className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noFarms")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {farms.map((farm) => (
              <Card key={farm.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{farm.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        {getFarmTypeLabel(farm.type, t)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {farm.isVerified && (
                        <Badge variant="default" className="gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          {t("verified")}
                        </Badge>
                      )}
                      {farm.isOrganic && (
                        <Badge variant="secondary" className="gap-1">
                          <Leaf className="h-3 w-3" />
                          {t("organic")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {farm.totalAreaHectares && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {farm.totalAreaHectares} ha
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    {new Date(farm.createdAt).toLocaleDateString(locale)}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(farm.id)}>
                      <Edit className="h-3 w-3 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(farm.id)}>
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
