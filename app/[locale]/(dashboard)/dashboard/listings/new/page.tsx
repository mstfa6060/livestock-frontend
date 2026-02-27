"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedCountry } from "@/components/layout/country-switcher";
import { toast } from "sonner";
import { useCategories } from "@/hooks/queries";
import { queryKeys } from "@/lib/query-keys";
import { listingFormSchema, type ListingFormData } from "@/lib/validations";
import dynamic from "next/dynamic";
const MediaUpload = dynamic(() => import("@/components/features/media-upload").then(mod => ({ default: mod.MediaUpload })), { ssr: false });

interface MediaFile {
  id: string;
  path: string;
  url: string;
  isVideo: boolean;
  name: string;
}

type ProductCondition = 0 | 1 | 2 | 3; // new, likeNew, good, fair

export default function NewListingPage() {
  const router = useRouter();
  const t = useTranslations("newListing");
  const tc = useTranslations("common");
  const tp = useTranslations("products");
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();
  const selectedCountry = useSelectedCountry();
  const queryClient = useQueryClient();

  const { data: categoriesData } = useCategories(locale);
  const categories = (categoriesData ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  const [isLoading, setIsLoading] = useState(false);

  // Media upload state
  const [mediaBucketId, setMediaBucketId] = useState<string>("");
  const [coverImageFileId, setCoverImageFileId] = useState<string>("");
  const [, setMediaFiles] = useState<MediaFile[]>([]);

  // Form with Zod validation
  const {
    register,
    handleSubmit: formSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      description: "",
      categoryId: "",
      basePrice: "",
      currency: selectedCountry?.defaultCurrencyCode || "TRY",
      priceUnit: "adet",
      stockQuantity: "1",
      stockUnit: "adet",
      condition: 0,
      isShippingAvailable: false,
      shippingCost: "",
      weight: "",
      weightUnit: "kg",
      city: "",
      address: "",
      postalCode: "",
    },
  });

  const isShippingAvailable = watch("isShippingAvailable");

  // Update currency when country changes
  useEffect(() => {
    if (selectedCountry?.defaultCurrencyCode) {
      setValue("currency", selectedCountry.defaultCurrencyCode);
    }
  }, [selectedCountry, setValue]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Handle media upload changes
  const handleMediaChange = (bucketId: string, coverFileId: string, files: MediaFile[]) => {
    setMediaBucketId(bucketId);
    setCoverImageFileId(coverFileId);
    setMediaFiles(files);
  };

  const onSubmit = async (data: ListingFormData, isDraft: boolean = false) => {
    if (!user?.id) {
      toast.error(t("userNotFound"));
      router.push("/login");
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(data.title);

      // Step 1: Check if Seller profile exists, if not create one
      let sellerId: string;

      try {
        const sellerResponse = await LivestockTradingAPI.Sellers.Detail.Request({
          id: user.id,
        });
        sellerId = sellerResponse.id;
      } catch {
        const newSeller = await LivestockTradingAPI.Sellers.Create.Request({
          userId: user.id,
          businessName: user.displayName || user.username || t("defaultBusinessName"),
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
      }

      // Step 2: Create Location
      const locationResponse = await LivestockTradingAPI.Locations.Create.Request({
        name: data.title,
        addressLine1: data.address,
        addressLine2: "",
        city: data.city,
        state: data.city,
        postalCode: data.postalCode || "",
        countryCode: selectedCountry?.code || "TR",
        latitude: 0,
        longitude: 0,
        phone: "",
        email: "",
        type: 0, // ProductLocation
        isActive: true,
      });

      // Step 3: Create Product with the sellerId and locationId
      await LivestockTradingAPI.Products.Create.Request({
        title: data.title,
        slug: slug,
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        basePrice: parseFloat(data.basePrice) as any,
        currency: data.currency,
        priceUnit: data.priceUnit,
        stockQuantity: parseInt(data.stockQuantity),
        stockUnit: data.stockUnit,
        isInStock: parseInt(data.stockQuantity) > 0,
        sellerId: sellerId,
        locationId: locationResponse.id,
        status: isDraft ? 0 : 1, // 0=Draft, 1=PendingApproval
        condition: data.condition,
        isShippingAvailable: data.isShippingAvailable,
        shippingCost: data.shippingCost
          ? (parseFloat(data.shippingCost) as any)
          : undefined,
        isInternationalShipping: false,
        weight: data.weight ? (parseFloat(data.weight) as any) : undefined,
        weightUnit: data.weightUnit,
        attributes: "{}",
        metaTitle: data.title,
        metaDescription: data.shortDescription,
        metaKeywords: "",
        mediaBucketId: mediaBucketId || "",
        coverImageFileId: coverImageFileId || "",
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success(isDraft ? t("draftSaved") : t("productCreated"));
      router.push("/dashboard/my-listings");
    } catch (error: any) {
      const errorMessage = error?.message || t("creationFailed");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = formSubmit((data) => onSubmit(data, false));
  const handleDraft = formSubmit((data) => onSubmit(data, true));

  return (
    <DashboardLayout>
      <form onSubmit={handlePublish}>
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
              onClick={handleDraft}
              disabled={isLoading || authLoading || !user?.id}
            >
              {t("saveDraft")}
            </Button>
            <Button type="submit" disabled={isLoading || authLoading || !user?.id}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tc("loading")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {authLoading ? tc("loading") : t("publish")}
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
                    {...register("title")}
                    placeholder={t("placeholders.title")}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">
                    {t("fields.shortDescription")} *
                  </Label>
                  <Textarea
                    id="shortDescription"
                    {...register("shortDescription")}
                    placeholder={t("placeholders.shortDescription")}
                    rows={2}
                  />
                  {errors.shortDescription && (
                    <p className="text-sm text-destructive">{errors.shortDescription.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("fields.description")} *</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder={t("placeholders.description")}
                    rows={6}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card>
              <CardHeader>
                <CardTitle>{t("images")}</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUpload
                  onMediaChange={handleMediaChange}
                  maxFiles={10}
                />
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
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    )}
                  />
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("fields.condition")} *</Label>
                  <Controller
                    name="condition"
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
                          <SelectItem value="0">{tp("condition.new")}</SelectItem>
                          <SelectItem value="1">{tp("condition.likeNew")}</SelectItem>
                          <SelectItem value="2">{tp("condition.good")}</SelectItem>
                          <SelectItem value="3">{tp("condition.fair")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
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
                      {...register("basePrice")}
                      placeholder="0.00"
                      className="flex-1"
                    />
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRY">TRY</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.basePrice && (
                    <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">{t("fields.stock")}</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="1"
                      {...register("stockQuantity")}
                    />
                    {errors.stockQuantity && (
                      <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockUnit">{t("fields.unit")}</Label>
                    <Input
                      id="stockUnit"
                      {...register("stockUnit")}
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
                    {...register("city")}
                    placeholder={t("placeholders.city")}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t("fields.address")} *</Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder={t("placeholders.address")}
                    rows={2}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t("fields.postalCode")}</Label>
                  <Input
                    id="postalCode"
                    {...register("postalCode")}
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
                <Controller
                  name="isShippingAvailable"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isShippingAvailable"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="isShippingAvailable" className="font-normal">
                        {t("fields.shippingAvailable")}
                      </Label>
                    </div>
                  )}
                />

                {isShippingAvailable && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="shippingCost">{t("fields.shippingCost")}</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("shippingCost")}
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
                          {...register("weight")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weightUnit">{t("fields.weightUnit")}</Label>
                        <Controller
                          name="weightUnit"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="lb">lb</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
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
