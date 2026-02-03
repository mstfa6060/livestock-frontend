"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, ImagePlus, X } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedCountry } from "@/components/layout/country-switcher";

interface Category {
  id: string;
  name: string;
  slug: string;
}

type ProductCondition = 0 | 1 | 2 | 3; // new, likeNew, good, fair

export default function NewListingPage() {
  const router = useRouter();
  const t = useTranslations("newListing");
  const tc = useTranslations("common");
  const tp = useTranslations("products");
  const { user, isLoading: authLoading } = useAuth();
  const selectedCountry = useSelectedCountry();

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Debug: Log user object when it changes
  useEffect(() => {
    console.log("👤 User object:", user);
    console.log("🔐 Auth loading:", authLoading);
  }, [user, authLoading]);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    basePrice: "",
    currency: selectedCountry?.defaultCurrencyCode || "TRY",
    priceUnit: "adet",
    stockQuantity: "1",
    stockUnit: "adet",
    condition: 0 as ProductCondition,
    isShippingAvailable: false,
    shippingCost: "",
    weight: "",
    weightUnit: "kg",
    // Location fields
    city: "",
    address: "",
    postalCode: "",
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await LivestockTradingAPI.Categories.All.Request({
          languageCode: "tr",
          sorting: { key: "sortOrder", direction: 0 },
          filters: [],
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: true },
        });
        setCategories(
          response.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
        );
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Update currency when country changes
  useEffect(() => {
    if (selectedCountry?.defaultCurrencyCode) {
      setFormData((prev) => ({
        ...prev,
        currency: selectedCountry.defaultCurrencyCode,
      }));
    }
  }, [selectedCountry]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      alert(t("maxImages"));
      return;
    }

    setImages((prev) => [...prev, ...files]);

    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      alert(t("errors.titleRequired"));
      return;
    }
    if (!formData.shortDescription.trim()) {
      alert(t("errors.shortDescriptionRequired"));
      return;
    }
    if (!formData.description.trim()) {
      alert(t("errors.descriptionRequired"));
      return;
    }
    if (!formData.categoryId) {
      alert(t("errors.categoryRequired"));
      return;
    }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      alert(t("errors.priceRequired"));
      return;
    }
    if (!formData.city.trim()) {
      alert(t("errors.cityRequired"));
      return;
    }
    if (!formData.address.trim()) {
      alert(t("errors.addressRequired"));
      return;
    }
    if (!user?.id) {
      console.error("❌ User object missing or no ID:", { user });
      alert("Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
      router.push("/login");
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(formData.title);

      // Step 1: Check if Seller profile exists, if not create one
      console.log("👤 Checking seller profile...");
      let sellerId: string;

      try {
        // Try to get existing seller profile by user id
        const sellerResponse = await LivestockTradingAPI.Sellers.Detail.Request({
          id: user.id,
        });
        sellerId = sellerResponse.id;
        console.log("✅ Seller profile found:", sellerId);
      } catch {
        // Seller doesn't exist, create one
        console.log("📝 Creating seller profile...");
        const newSeller = await LivestockTradingAPI.Sellers.Create.Request({
          userId: user.id,
          businessName: user.displayName || user.username || "My Business",
          businessType: "Individual",
          taxNumber: "",
          registrationNumber: "",
          description: "",
          logoUrl: "",
          bannerUrl: "",
          email: user.email || "",
          phone: "",
          website: "",
          isActive: true,
          status: 0,
          businessHours: "",
          acceptedPaymentMethods: "",
          returnPolicy: "",
          shippingPolicy: "",
          socialMediaLinks: "",
        });
        sellerId = newSeller.id;
        console.log("✅ Seller profile created:", sellerId);
      }

      // Step 2: Create Location
      console.log("📍 Creating location...");
      const locationResponse = await LivestockTradingAPI.Locations.Create.Request({
        name: formData.title,
        addressLine1: formData.address,
        addressLine2: "",
        city: formData.city,
        state: formData.city,
        postalCode: formData.postalCode || "",
        countryCode: selectedCountry?.code || "TR",
        latitude: 0,
        longitude: 0,
        phone: "",
        email: "",
        type: 0, // ProductLocation
        isActive: true,
      });

      console.log("✅ Location created:", locationResponse.id);

      // Step 3: Create Product with the sellerId and locationId
      console.log("📤 Creating product with payload:", {
        title: formData.title,
        categoryId: formData.categoryId,
        basePrice: parseFloat(formData.basePrice),
        sellerId: sellerId,
        locationId: locationResponse.id,
        status: isDraft ? 0 : 4, // 0=draft, 4=pendingApproval
      });

      await LivestockTradingAPI.Products.Create.Request({
        title: formData.title,
        slug: slug,
        description: formData.description,
        shortDescription: formData.shortDescription,
        categoryId: formData.categoryId,
        basePrice: parseFloat(formData.basePrice) as any,
        currency: formData.currency,
        priceUnit: formData.priceUnit,
        stockQuantity: parseInt(formData.stockQuantity),
        stockUnit: formData.stockUnit,
        isInStock: parseInt(formData.stockQuantity) > 0,
        sellerId: sellerId,
        locationId: locationResponse.id,
        status: isDraft ? 0 : 4, // 0=draft, 4=pendingApproval
        condition: formData.condition,
        isShippingAvailable: formData.isShippingAvailable,
        shippingCost: formData.shippingCost
          ? (parseFloat(formData.shippingCost) as any)
          : undefined,
        isInternationalShipping: false,
        weight: formData.weight ? (parseFloat(formData.weight) as any) : undefined,
        weightUnit: formData.weightUnit,
        attributes: "{}",
        metaTitle: formData.title,
        metaDescription: formData.shortDescription,
        metaKeywords: "",
      });

      console.log("✅ Product created successfully");

      // TODO: Upload images separately using FileProvider API

      router.push("/dashboard/my-listings");
    } catch (error: any) {
      console.error("❌ Failed to create listing:", error);

      // Show user-friendly error message
      const errorMessage = error?.message || "Failed to create listing. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isLoading || authLoading || !user?.id}
            >
              {t("saveDraft")}
            </Button>
            <Button type="submit" disabled={isLoading || authLoading || !user?.id}>
              <Save className="h-4 w-4 mr-2" />
              {authLoading ? "Yükleniyor..." : isLoading ? tc("loading") : t("publish")}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("fields.title")} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={t("placeholders.title")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">
                    {t("fields.shortDescription")} *
                  </Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, shortDescription: e.target.value })
                    }
                    placeholder={t("placeholders.shortDescription")}
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("fields.description")} *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t("placeholders.description")}
                    rows={6}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>{t("images")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {images.length < 10 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">
                        {t("addImage")}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("imageHint")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category & Condition */}
            <Card>
              <CardHeader>
                <CardTitle>{t("categoryAndCondition")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("fields.category")} *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, categoryId: v })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("placeholders.category")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("fields.condition")} *</Label>
                  <Select
                    value={String(formData.condition)}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        condition: parseInt(v) as ProductCondition,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{tp("condition.new")}</SelectItem>
                      <SelectItem value="1">{tp("condition.likeNew")}</SelectItem>
                      <SelectItem value="2">{tp("condition.good")}</SelectItem>
                      <SelectItem value="3">{tp("condition.fair")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>{t("pricing")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">{t("fields.price")} *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, basePrice: e.target.value })
                      }
                      placeholder="0.00"
                      className="flex-1"
                      required
                    />
                    <Select
                      value={formData.currency}
                      onValueChange={(v) =>
                        setFormData({ ...formData, currency: v })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">{t("fields.stock")}</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="1"
                      value={formData.stockQuantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stockQuantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockUnit">{t("fields.unit")}</Label>
                    <Input
                      id="stockUnit"
                      value={formData.stockUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, stockUnit: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>{t("location")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("fields.city")} *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder={t("placeholders.city")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t("fields.address")} *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder={t("placeholders.address")}
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t("fields.postalCode")}</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder={t("placeholders.postalCode")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle>{t("shipping")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isShippingAvailable"
                    checked={formData.isShippingAvailable}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isShippingAvailable: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="isShippingAvailable" className="font-normal">
                    {t("fields.shippingAvailable")}
                  </Label>
                </div>

                {formData.isShippingAvailable && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="shippingCost">{t("fields.shippingCost")}</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.shippingCost}
                        onChange={(e) =>
                          setFormData({ ...formData, shippingCost: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">{t("fields.weight")}</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.weight}
                          onChange={(e) =>
                            setFormData({ ...formData, weight: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weightUnit">{t("fields.weightUnit")}</Label>
                        <Select
                          value={formData.weightUnit}
                          onValueChange={(v) =>
                            setFormData({ ...formData, weightUnit: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
