"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedCountry } from "@/components/layout/country-switcher";
import { toast } from "sonner";
import dynamic from "next/dynamic";
const MediaUpload = dynamic(() => import("@/components/features/media-upload").then(mod => ({ default: mod.MediaUpload })), { ssr: false });

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MediaFile {
  id: string;
  path: string;
  url: string;
  isVideo: boolean;
  name: string;
}

type ProductCondition = 0 | 1 | 2 | 3; // new, likeNew, good, fair

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const t = useTranslations("editListing");
  const tc = useTranslations("common");
  const tp = useTranslations("products");
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();
  const selectedCountry = useSelectedCountry();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<number>(0);
  const [originalLocationId, setOriginalLocationId] = useState<string>("");

  // Media state - new system
  const [mediaBucketId, setMediaBucketId] = useState<string>("");
  const [coverImageFileId, setCoverImageFileId] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!user?.id) return;

      try {
        // Find seller profile by userId using Sellers.All with filter
        const sellersResponse = await LivestockTradingAPI.Sellers.All.Request({
          sorting: { key: "createdAt", direction: 1 },
          filters: [
            {
              key: "userId",
              type: "guid",
              isUsed: true,
              values: [user.id],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 1, listAll: false },
        });

        if (sellersResponse.length > 0) {
          setSellerId(sellersResponse[0].id);
        } else {
          toast.error(t("sellerNotFound"));
          router.push("/dashboard/my-listings");
        }
      } catch {
        toast.error(t("sellerLoadError"));
      }
    };

    fetchSellerProfile();
  }, [user?.id, router]);

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

  // Load categories AND product data together to ensure proper state sync
  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;

      setIsLoading(true);
      try {
        // Load categories first
        const categoriesResponse = await LivestockTradingAPI.Categories.All.Request({
          languageCode: locale,
          sorting: { key: "sortOrder", direction: 0 },
          filters: [],
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
        });
        const loadedCategories = categoriesResponse.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
        setCategories(loadedCategories);
        // Then load product details
        const product = await LivestockTradingAPI.Products.Detail.Request({ id: productId });

        // Store original status and locationId
        setOriginalStatus(product.status);
        setOriginalLocationId(product.locationId);

        // Store media bucket info
        const productBucketId = (product as any).mediaBucketId || "";
        const productCoverFileId = (product as any).coverImageFileId || "";
        setMediaBucketId(productBucketId);
        setCoverImageFileId(productCoverFileId);

        // Load existing files from bucket if exists
        if (productBucketId && productBucketId !== EMPTY_GUID) {
          try {
            const bucketResponse = await FileProviderAPI.Buckets.Detail.Request({
              bucketId: productBucketId,
              changeId: EMPTY_GUID,
            });

            if (bucketResponse.files && bucketResponse.files.length > 0) {
              const loadedFiles: MediaFile[] = bucketResponse.files.map((f) => ({
                id: f.id,
                path: f.path,
                url: `${AppConfig.FileStorageBaseUrl}${f.path}`,
                isVideo: f.contentType?.startsWith("video/") || false,
                name: f.name,
              }));
              setMediaFiles(loadedFiles);
            }
          } catch {
            // No existing bucket or empty
          }
        }

        // Populate form - categoryId should now match a loaded category
        setFormData({
          title: product.title,
          shortDescription: product.shortDescription,
          description: product.description,
          categoryId: product.categoryId,
          basePrice: String(product.basePrice),
          currency: product.currency,
          priceUnit: product.priceUnit,
          stockQuantity: String(product.stockQuantity),
          stockUnit: product.stockUnit,
          condition: product.condition as ProductCondition,
          isShippingAvailable: product.isShippingAvailable,
          shippingCost: product.shippingCost ? String(product.shippingCost) : "",
          weight: product.weight ? String(product.weight) : "",
          weightUnit: product.weightUnit,
        });

        // Verify category exists in loaded categories
      } catch {
        toast.error(t("loadError"));
        router.push("/dashboard/my-listings");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId, router, t]);

  // Handle media change from MediaUpload component
  const handleMediaChange = (bucketId: string, coverFileId: string, files: MediaFile[]) => {
    setMediaBucketId(bucketId);
    setCoverImageFileId(coverFileId);
    setMediaFiles(files);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error(t("errors.titleRequired"));
      return;
    }
    if (!formData.shortDescription.trim()) {
      toast.error(t("errors.shortDescriptionRequired"));
      return;
    }
    if (!formData.description.trim()) {
      toast.error(t("errors.descriptionRequired"));
      return;
    }
    if (!formData.categoryId) {
      toast.error(t("errors.categoryRequired"));
      return;
    }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error(t("errors.priceRequired"));
      return;
    }
    if (!user?.id) {
      toast.error(t("userNotFound"));
      router.push("/login");
      return;
    }
    if (!sellerId) {
      toast.error(t("sellerNotFound"));
      return;
    }
    if (!originalLocationId) {
      toast.error(t("locationNotFound"));
      return;
    }

    setIsSaving(true);

    try {
      const slug = generateSlug(formData.title);

      await LivestockTradingAPI.Products.Update.Request({
        id: productId,
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
        locationId: originalLocationId,
        status: originalStatus,
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
        // New media fields
        mediaBucketId: mediaBucketId || EMPTY_GUID,
        coverImageFileId: coverImageFileId || EMPTY_GUID,
      } as any);

      toast.success(t("updateSuccess"));
      router.push("/dashboard/my-listings");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message
        || error.response?.data?.message
        || error.message
        || t("updateFailed");
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit}>
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
            <Button type="submit" disabled={isSaving || authLoading || !user?.id || !sellerId}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tc("loading")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {authLoading ? tc("loading") : t("saveChanges")}
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

            {/* Media Upload - New System */}
            <Card>
              <CardHeader>
                <CardTitle>{t("images")}</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUpload
                  entityId={productId}
                  onMediaChange={handleMediaChange}
                  initialBucketId={mediaBucketId}
                  initialFiles={mediaFiles}
                  maxFiles={10}
                />
                <p className="text-xs text-muted-foreground mt-4">
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
