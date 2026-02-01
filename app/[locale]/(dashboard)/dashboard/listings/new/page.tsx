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
import { ArrowLeft, Save, ImagePlus, X, Loader2 } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedCountry } from "@/components/layout/country-switcher";
import { toast } from "sonner";
import axios from "axios";
import { AppConfig } from "@/config/livestock-config";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
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

  // Upload image to FileProvider
  const uploadImageToFileProvider = async (file: File, bucketId: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("formFile", file);
      formData.append("moduleName", "LivestockTrading");
      formData.append("bucketId", bucketId);
      formData.append("bucketType", "1"); // MultipleFileBucket
      formData.append("folderName", "products");
      formData.append("versionName", "original");

      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${AppConfig.FileProviderUrl}/Files/Upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.files && response.data.files.length > 0) {
        const file = response.data.files[0];
        // Return the full URL or the first variant URL
        return file.variants && file.variants.length > 0
          ? file.variants[0].url
          : file.path;
      }

      return null;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
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
    if (!user?.id) {
      console.error("❌ User object missing or no ID:", { user });
      alert("Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setUploadStatus(t("creating"));

    try {
      const slug = generateSlug(formData.title);

      console.log("📤 Creating product with payload:", {
        title: formData.title,
        categoryId: formData.categoryId,
        basePrice: parseFloat(formData.basePrice),
        sellerId: user.id,
        userId: user.id,
        status: isDraft ? 0 : 3,
        userObject: user,
      });

      const productResponse = await LivestockTradingAPI.Products.Create.Request({
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
        sellerId: user.id,
        locationId: "602cb4fa-50c8-4d69-88a0-d411b25a2c34", // TODO: Fetch from user's actual location
        status: isDraft ? 0 : 3, // 0=draft, 3=pending
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

      console.log("✅ Product created successfully:", productResponse);

      // Upload images if any
      if (images.length > 0) {
        setUploadStatus(t("uploadingImages"));
        const productId = productResponse.id;
        const bucketId = `product-${productId}`;

        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          setUploadStatus(`${t("uploadingImage")} ${i + 1}/${images.length}`);

          try {
            // Upload to FileProvider
            const imageUrl = await uploadImageToFileProvider(image, bucketId);

            if (imageUrl) {
              // Link image to product
              await LivestockTradingAPI.ProductImages.Create.Request({
                productId: productId,
                imageUrl: imageUrl,
                thumbnailUrl: imageUrl, // Use same URL for now
                altText: formData.title,
                sortOrder: i,
                isPrimary: i === 0, // First image is primary
              });

              console.log(`✅ Image ${i + 1} uploaded and linked`);
            }

            // Update progress
            setUploadProgress(((i + 1) / images.length) * 100);
          } catch (imageError) {
            console.error(`Failed to upload image ${i + 1}:`, imageError);
            toast.error(`${t("imageUploadFailed")} ${i + 1}`);
          }
        }

        toast.success(t("imagesUploaded"));
      }

      toast.success(isDraft ? t("draftSaved") : t("productCreated"));
      router.push("/dashboard/my-listings");
    } catch (error: any) {
      console.error("❌ Failed to create listing:", error);

      const errorMessage = error?.message || t("creationFailed");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setUploadStatus("");
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
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadStatus || tc("loading")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {authLoading ? "Yükleniyor..." : t("publish")}
                </>
              )}
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
