"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
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
import { ArrowLeft, Save, Loader2, CloudOff, Cloud } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedCountry } from "@/components/layout/country-switcher";
import { toast } from "sonner";
import { useCategories, useCurrencies } from "@/hooks/queries";
import { queryKeys } from "@/lib/query-keys";
import { listingFormSchema, type ListingFormData } from "@/lib/validations";
import { CurrencyCombobox, type CurrencyOption } from "@/components/features/currency-combobox";
import { LocationSelector } from "@/components/features/location-selector";
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
  const allCategories = (categoriesData ?? []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, parentCategoryId: c.parentCategoryId }));

  // Multi-level cascading category selection
  const [categoryPath, setCategoryPath] = useState<string[]>([]);

  const getChildren = (parentId: string | null) =>
    allCategories.filter((c) => parentId ? c.parentCategoryId === parentId : !c.parentCategoryId);

  // Build the cascade levels: [root options, level1 options, level2 options, ...]
  const categoryLevels: { parentId: string | null; options: typeof allCategories }[] = [];
  categoryLevels.push({ parentId: null, options: getChildren(null) });
  for (const selectedId of categoryPath) {
    const children = getChildren(selectedId);
    if (children.length === 0) break;
    categoryLevels.push({ parentId: selectedId, options: children });
  }

  const handleCategoryChange = (level: number, value: string) => {
    const newPath = [...categoryPath.slice(0, level), value];
    setCategoryPath(newPath);
    // Set categoryId to leaf: if selected node has children, clear it (force drilling down)
    const hasChildren = allCategories.some((c) => c.parentCategoryId === value);
    setValue("categoryId", hasChildren ? "" : value, { shouldValidate: true });
  };

  const { data: currenciesData } = useCurrencies();
  const currencies = (currenciesData ?? []).filter((c: any) => c.isActive).sort((a: any, b: any) => a.code.localeCompare(b.code));
  const currencyOptions: CurrencyOption[] = currencies.map((c: any) => ({ code: c.code, symbol: c.symbol, name: c.name }));

  const [isLoading, setIsLoading] = useState(false);

  // Province/District/Neighborhood state for LocationSelector
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<number | null>(null);
  const [selectedNeighborhoodName, setSelectedNeighborhoodName] = useState("");

  // Media upload state
  const [mediaBucketId, setMediaBucketId] = useState<string>("");
  const [coverImageFileId, setCoverImageFileId] = useState<string>("");
  const [, setMediaFiles] = useState<MediaFile[]>([]);

  // Form with Zod validation
  const DRAFT_KEY = "listing-draft";
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoredRef = useRef(false);

  // Restore draft from localStorage
  const getSavedDraft = useCallback((): Partial<ListingFormData> | null => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, []);

  const savedDraft = getSavedDraft();

  const {
    register,
    handleSubmit: formSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: savedDraft?.title || "",
      shortDescription: savedDraft?.shortDescription || "",
      description: savedDraft?.description || "",
      categoryId: savedDraft?.categoryId || "",
      basePrice: savedDraft?.basePrice || "",
      currency: savedDraft?.currency || user?.currencyCode || selectedCountry?.defaultCurrencyCode || "USD",
      priceUnit: savedDraft?.priceUnit || "adet",
      stockQuantity: savedDraft?.stockQuantity || "1",
      stockUnit: savedDraft?.stockUnit || "adet",
      condition: savedDraft?.condition ?? 0,
      isShippingAvailable: savedDraft?.isShippingAvailable || false,
      shippingCost: savedDraft?.shippingCost || "",
      weight: savedDraft?.weight || "",
      weightUnit: savedDraft?.weightUnit || "kg",
      city: savedDraft?.city || "",
      address: savedDraft?.address || "",
      postalCode: savedDraft?.postalCode || "",
    },
  });

  // Auto-save form to localStorage (debounced 2s)
  const formValues = watch();
  useEffect(() => {
    if (!isRestoredRef.current) {
      isRestoredRef.current = true;
      return;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } catch {
        // Storage full or unavailable
      }
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [JSON.stringify(formValues)]); // eslint-disable-line react-hooks/exhaustive-deps

  const isShippingAvailable = watch("isShippingAvailable");

  // Set default currency: user's preferred currency > country currency > USD
  useEffect(() => {
    if (user?.currencyCode) {
      setValue("currency", user.currencyCode);
    } else if (selectedCountry?.defaultCurrencyCode) {
      setValue("currency", selectedCountry.defaultCurrencyCode);
    }
  }, [user?.currencyCode, selectedCountry, setValue]);

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

  const onSubmit = async (data: ListingFormData) => {
    if (!user?.id) {
      toast.error(t("userNotFound"));
      router.push(locale === "en" ? "/login" : `/${locale}/login`);
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(data.title);

      // Step 1: Check if Seller profile exists, if not create one
      let sellerId: string;

      try {
        const sellerResponse = await LivestockTradingAPI.Sellers.GetByUserId.Request({
          userId: user.id,
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

      // Step 2: Create Location (districtId gönderilirse backend koordinatları otomatik doldurur)
      const cityName = selectedNeighborhoodName || selectedDistrictName || selectedProvinceName || data.city;
      const stateName = selectedProvinceName || data.city;
      const addressParts = [data.address, selectedNeighborhoodName].filter(Boolean);
      const locationResponse = await LivestockTradingAPI.Locations.Create.Request({
        name: data.title,
        addressLine1: addressParts.join(", "),
        addressLine2: "",
        city: cityName,
        state: stateName,
        postalCode: data.postalCode || "",
        countryCode: selectedCountry?.code || "TR",
        phone: "",
        email: "",
        type: 0, // ProductLocation
        isActive: true,
        districtId: selectedDistrictId ?? undefined,
      });

      // Step 3: Create Product with the sellerId and locationId
      await LivestockTradingAPI.Products.Create.Request({
        title: data.title,
        slug: slug,
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        basePrice: parseFloat(data.basePrice),
        currency: data.currency,
        priceUnit: data.priceUnit,
        stockQuantity: parseInt(data.stockQuantity),
        stockUnit: data.stockUnit,
        isInStock: parseInt(data.stockQuantity) > 0,
        sellerId: sellerId,
        locationId: locationResponse.id,
        status: 0, // Always create as Draft (backend enforces this)
        condition: data.condition,
        isShippingAvailable: data.isShippingAvailable,
        shippingCost: data.shippingCost
          ? parseFloat(data.shippingCost)
          : undefined,
        isInternationalShipping: false,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        weightUnit: data.weightUnit,
        attributes: "{}",
        metaTitle: data.title,
        metaDescription: data.shortDescription,
        metaKeywords: "",
        mediaBucketId: mediaBucketId || "",
        coverImageFileId: coverImageFileId || "",
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      localStorage.removeItem(DRAFT_KEY);
      toast.success(t("draftSaved"));
      router.push("/dashboard/my-listings");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("creationFailed");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = formSubmit((data) => onSubmit(data));

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
            {autoSaveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cloud className="h-3 w-3" />
                {t("autoSaved")}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || authLoading || !user?.id}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tc("loading")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {authLoading ? tc("loading") : t("saveDraft")}
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
                {categoryLevels.map((level, index) => (
                  <div key={level.parentId ?? "root"} className="space-y-2">
                    <Label>
                      {index === 0 ? t("fields.category") : t("fields.subCategory")} *
                    </Label>
                    <Select
                      value={categoryPath[index] ?? ""}
                      onValueChange={(value) => handleCategoryChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={index === 0 ? t("placeholders.category") : t("placeholders.subCategory")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {level.options.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}

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
                        <CurrencyCombobox
                          currencies={currencyOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={t("fields.currency")}
                          searchPlaceholder={t("placeholders.searchCurrency")}
                          emptyText={t("noCurrencyFound")}
                          className="w-36"
                        />
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
                <LocationSelector
                  countryId={selectedCountry?.id ?? 0}
                  provinceId={selectedProvinceId}
                  districtId={selectedDistrictId}
                  neighborhoodId={selectedNeighborhoodId}
                  onProvinceChange={(id, name) => {
                    setSelectedProvinceId(id);
                    setSelectedProvinceName(name);
                    setValue("city", name, { shouldValidate: true });
                  }}
                  onDistrictChange={(id, name) => {
                    setSelectedDistrictId(id);
                    setSelectedDistrictName(name);
                  }}
                  onNeighborhoodChange={(id, name) => {
                    setSelectedNeighborhoodId(id);
                    setSelectedNeighborhoodName(name);
                  }}
                />

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
