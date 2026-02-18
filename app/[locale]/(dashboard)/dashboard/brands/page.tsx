"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import {
  Tag,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  BadgeCheck,
  Globe,
  Package,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  website: string;
  isActive: boolean;
  isVerified: boolean;
  productCount: number;
  createdAt: Date;
}

interface BrandFormData {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  website: string;
  email: string;
  phone: string;
  countryCode: string;
}

export default function BrandsPage() {
  const t = useTranslations("brands");
  const { isAdmin } = useRoles();

  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BrandFormData>({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
    website: "",
    email: "",
    phone: "",
    countryCode: "TR",
  });

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const response = await LivestockTradingAPI.Brands.All.Request({
          sorting: {
            key: "name",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
          },
          filters: [],
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
        });

        setBrands(
          response.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            description: "",
            logoUrl: "",
            website: "",
            isActive: b.isActive,
            isVerified: b.isVerified,
            productCount: b.productCount,
            createdAt: b.createdAt,
          }))
        );
      } catch {
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, [t]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      website: "",
      email: "",
      phone: "",
      countryCode: "TR",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (brandId: string) => {
    try {
      const detail = await LivestockTradingAPI.Brands.Detail.Request({ id: brandId });
      setFormData({
        name: detail.name,
        slug: detail.slug,
        description: detail.description || "",
        logoUrl: detail.logoUrl || "",
        website: detail.website || "",
        email: detail.email || "",
        phone: detail.phone || "",
        countryCode: detail.countryCode || "TR",
      });
      setEditingId(brandId);
      setShowForm(true);
    } catch {
      toast.error(t("fetchError"));
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      if (editingId) {
        await LivestockTradingAPI.Brands.Update.Request({
          id: editingId,
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description,
          logoUrl: formData.logoUrl,
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
          countryCode: formData.countryCode,
          isActive: true,
          isVerified: false,
        });
        toast.success(t("updateSuccess"));
      } else {
        await LivestockTradingAPI.Brands.Create.Request({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description,
          logoUrl: formData.logoUrl,
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
          countryCode: formData.countryCode,
          isActive: true,
        });
        toast.success(t("createSuccess"));
      }

      resetForm();

      // Refresh
      const response = await LivestockTradingAPI.Brands.All.Request({
        sorting: { key: "name", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
        filters: [],
        pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
      });

      setBrands(
        response.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: "",
          logoUrl: "",
          website: "",
          isActive: b.isActive,
          isVerified: b.isVerified,
          productCount: b.productCount,
          createdAt: b.createdAt,
        }))
      );
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    try {
      await LivestockTradingAPI.Brands.Delete.Request({ id: brandId });
      setBrands((prev) => prev.filter((b) => b.id !== brandId));
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("unauthorized")}</p>
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
              <Tag className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addBrand")}
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editBrand") : t("addBrand")}
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand-name">{t("brandName")}</Label>
                    <Input
                      id="brand-name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand-slug">Slug</Label>
                    <Input
                      id="brand-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand-website">{t("website")}</Label>
                    <Input
                      id="brand-website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand-logo">{t("logoUrl")}</Label>
                    <Input
                      id="brand-logo"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="brand-desc">{t("brandDescription")}</Label>
                  <Textarea
                    id="brand-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
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

        {/* Brands List */}
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
        ) : brands.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noBrands")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Card key={brand.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{brand.name}</h3>
                    <div className="flex gap-1">
                      {brand.isVerified && (
                        <Badge variant="default" className="gap-1 text-xs">
                          <BadgeCheck className="h-3 w-3" />
                        </Badge>
                      )}
                      {!brand.isActive && (
                        <Badge variant="outline" className="text-xs">
                          {t("inactive")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Package className="h-3 w-3" />
                    {brand.productCount} {t("products")}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(brand.id)}>
                      <Edit className="h-3 w-3 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(brand.id)}>
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
