"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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

interface FarmFormData {
  name: string;
  description: string;
  registrationNumber: string;
  type: number;
  totalAreaHectares: string;
  cultivatedAreaHectares: string;
  certifications: string;
  isOrganic: boolean;
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

  const [isLoading, setIsLoading] = useState(true);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FarmFormData>({
    name: "",
    description: "",
    registrationNumber: "",
    type: FarmType.Livestock,
    totalAreaHectares: "",
    cultivatedAreaHectares: "",
    certifications: "",
    isOrganic: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // First get seller profile
        const sellerResponse = await LivestockTradingAPI.Sellers.GetByUserId.Request({
          userId: user.id,
        });

        if (!sellerResponse?.id) {
          setIsLoading(false);
          return;
        }

        setSellerId(sellerResponse.id);

        // Then fetch farms for this seller
        const farmsResponse = await LivestockTradingAPI.Farms.All.Request({
          sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
          filters: [
            {
              key: "sellerId",
              type: "guid",
              isUsed: true,
              values: [sellerResponse.id],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
        });

        setFarms(
          farmsResponse.map((f) => ({
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
          }))
        );
      } catch {
        // Seller profile might not exist
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      registrationNumber: "",
      type: FarmType.Livestock,
      totalAreaHectares: "",
      cultivatedAreaHectares: "",
      certifications: "",
      isOrganic: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (farmId: string) => {
    try {
      const detail = await LivestockTradingAPI.Farms.Detail.Request({ id: farmId });
      setFormData({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId || !user?.id) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update
        const detail = await LivestockTradingAPI.Farms.Detail.Request({ id: editingId });
        await LivestockTradingAPI.Farms.Update.Request({
          id: editingId,
          name: formData.name,
          description: formData.description,
          registrationNumber: formData.registrationNumber,
          sellerId,
          locationId: detail.locationId,
          type: formData.type,
          totalAreaHectares: formData.totalAreaHectares ? parseFloat(formData.totalAreaHectares) as any : undefined,
          cultivatedAreaHectares: formData.cultivatedAreaHectares ? parseFloat(formData.cultivatedAreaHectares) as any : undefined,
          certifications: formData.certifications,
          isOrganic: formData.isOrganic,
          imageUrls: detail.imageUrls || "",
          videoUrl: detail.videoUrl || "",
          isActive: true,
          isVerified: detail.isVerified,
        });
        toast.success(t("updateSuccess"));
      } else {
        // Create
        await LivestockTradingAPI.Farms.Create.Request({
          name: formData.name,
          description: formData.description,
          registrationNumber: formData.registrationNumber,
          sellerId,
          locationId: "00000000-0000-0000-0000-000000000000",
          type: formData.type,
          totalAreaHectares: formData.totalAreaHectares ? parseFloat(formData.totalAreaHectares) as any : undefined,
          cultivatedAreaHectares: formData.cultivatedAreaHectares ? parseFloat(formData.cultivatedAreaHectares) as any : undefined,
          certifications: formData.certifications,
          isOrganic: formData.isOrganic,
          imageUrls: "",
          videoUrl: "",
          isActive: true,
        });
        toast.success(t("createSuccess"));
      }

      resetForm();

      // Refresh farms list
      const farmsResponse = await LivestockTradingAPI.Farms.All.Request({
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          {
            key: "sellerId",
            type: "guid",
            isUsed: true,
            values: [sellerId],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      });

      setFarms(
        farmsResponse.map((f) => ({
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
        }))
      );
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (farmId: string) => {
    try {
      await LivestockTradingAPI.Farms.Delete.Request({ id: farmId });
      setFarms((prev) => prev.filter((f) => f.id !== farmId));
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="farm-name">{t("farmName")}</Label>
                    <Input
                      id="farm-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="farm-reg">{t("registrationNumber")}</Label>
                    <Input
                      id="farm-reg"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="farm-type">{t("farmTypeLabel")}</Label>
                    <select
                      id="farm-type"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                    >
                      {Object.entries(FarmType).map(([key, value]) => (
                        <option key={key} value={value}>
                          {getFarmTypeLabel(value, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="farm-area">{t("totalArea")} (ha)</Label>
                    <Input
                      id="farm-area"
                      type="number"
                      step="0.01"
                      value={formData.totalAreaHectares}
                      onChange={(e) => setFormData({ ...formData, totalAreaHectares: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="farm-cultivated">{t("cultivatedArea")} (ha)</Label>
                    <Input
                      id="farm-cultivated"
                      type="number"
                      step="0.01"
                      value={formData.cultivatedAreaHectares}
                      onChange={(e) => setFormData({ ...formData, cultivatedAreaHectares: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="farm-organic"
                      type="checkbox"
                      checked={formData.isOrganic}
                      onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="farm-organic">{t("organic")}</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="farm-desc">{t("farmDescription")}</Label>
                  <Textarea
                    id="farm-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="farm-certs">{t("certifications")}</Label>
                  <Input
                    id="farm-certs"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
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
