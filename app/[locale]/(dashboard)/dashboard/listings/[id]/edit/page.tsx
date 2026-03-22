"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
import { useCategories, useCurrencies, useProductDetail, useSellerByUserId } from "@/hooks/queries";
import { queryKeys } from "@/lib/query-keys";
import { editListingFormSchema, type EditListingFormData } from "@/lib/validations";
import { CurrencyCombobox, type CurrencyOption } from "@/components/features/currency-combobox";
import dynamic from "next/dynamic";
const MediaUpload = dynamic(() => import("@/components/features/media-upload").then(mod => ({ default: mod.MediaUpload })), { ssr: false });

interface MediaFile {
  id: string;
  path: string;
  url: string;
  isVideo: boolean;
  name: string;
}

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

// Extended product type for fields not in auto-generated types
interface ProductWithMedia {
  mediaBucketId?: string;
  coverImageFileId?: string;
  [key: string]: unknown;
}

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
  const queryClient = useQueryClient();

  // Data fetching via React Query
  const { data: categoriesData } = useCategories(locale);
  const allCategories = (categoriesData ?? []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, parentCategoryId: c.parentCategoryId }));

  // Multi-level cascading category selection
  const [categoryPath, setCategoryPath] = useState<string[]>([]);

  const getChildren = (parentId: string | null) =>
    allCategories.filter((c) => parentId ? c.parentCategoryId === parentId : !c.parentCategoryId);

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
    const hasChildren = allCategories.some((c) => c.parentCategoryId === value);
    setValue("categoryId", hasChildren ? "" : value, { shouldValidate: true });
  };

  const { data: currenciesData } = useCurrencies();
  const currencies = (currenciesData ?? []).filter((c: any) => c.isActive).sort((a: any, b: any) => a.code.localeCompare(b.code));
  const currencyOptions: CurrencyOption[] = currencies.map((c: any) => ({ code: c.code, symbol: c.symbol, name: c.name }));

  const { data: product, isLoading: isProductLoading, isError: isProductError } = useProductDetail(productId);

  const { data: sellerData } = useSellerByUserId(user?.id ?? "", { enabled: !!user?.id });
  const sellerId = sellerData?.id ?? null;

  // Fetch media bucket files for the product
  const productBucketId = (product as unknown as ProductWithMedia)?.mediaBucketId || "";
  const { data: bucketFiles } = useQuery({
    queryKey: queryKeys.fileBuckets.detail(productBucketId),
    queryFn: async () => {
      const bucketResponse = await FileProviderAPI.Buckets.Detail.Request({
        bucketId: productBucketId,
        changeId: EMPTY_GUID,
      });
      if (!bucketResponse.files || bucketResponse.files.length === 0) return [];
      return bucketResponse.files.map((f) => ({
        id: f.id,
        path: f.path,
        url: `${AppConfig.FileStorageBaseUrl}${f.path}`,
        isVideo: f.contentType?.startsWith("video/") || false,
        name: f.name,
      })) as MediaFile[];
    },
    enabled: !!productBucketId && productBucketId !== EMPTY_GUID,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formPopulated, setFormPopulated] = useState(false);

  // Media state
  const [mediaBucketId, setMediaBucketId] = useState<string>("");
  const [coverImageFileId, setCoverImageFileId] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Form with Zod validation
  const {
    register,
    handleSubmit: formSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditListingFormData>({
    resolver: zodResolver(editListingFormSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      description: "",
      categoryId: "",
      basePrice: "",
      currency: user?.currencyCode || selectedCountry?.defaultCurrencyCode || "USD",
      priceUnit: "adet",
      stockQuantity: "1",
      stockUnit: "adet",
      condition: 0,
      isShippingAvailable: false,
      shippingCost: "",
      weight: "",
      weightUnit: "kg",
    },
  });

  const isShippingAvailable = watch("isShippingAvailable");

  // Populate form when product data loads
  useEffect(() => {
    if (!product || formPopulated || allCategories.length === 0) return;

    setMediaBucketId((product as unknown as ProductWithMedia).mediaBucketId || "");
    setCoverImageFileId((product as unknown as ProductWithMedia).coverImageFileId || "");

    // Build categoryPath by walking up from product's categoryId to root
    const buildPath = (catId: string): string[] => {
      const path: string[] = [];
      let current = allCategories.find((c) => c.id === catId);
      while (current) {
        path.unshift(current.id);
        current = current.parentCategoryId
          ? allCategories.find((c) => c.id === current!.parentCategoryId)
          : undefined;
      }
      return path;
    };

    const path = buildPath(product.categoryId);
    setCategoryPath(path);

    // categoryId in form = the leaf (most specific) category
    const leafId = path[path.length - 1] || product.categoryId;
    const hasChildren = allCategories.some((c) => c.parentCategoryId === leafId);

    reset({
      title: product.title,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: hasChildren ? "" : leafId,
      basePrice: String(product.basePrice),
      currency: product.currency,
      priceUnit: product.priceUnit,
      stockQuantity: String(product.stockQuantity),
      stockUnit: product.stockUnit,
      condition: product.condition as 0 | 1 | 2 | 3,
      isShippingAvailable: product.isShippingAvailable,
      shippingCost: product.shippingCost ? String(product.shippingCost) : "",
      weight: product.weight ? String(product.weight) : "",
      weightUnit: product.weightUnit,
    });
    setFormPopulated(true);
  }, [product, formPopulated, allCategories, reset]);

  // Populate media files from bucket query
  useEffect(() => {
    if (bucketFiles && bucketFiles.length > 0 && mediaFiles.length === 0) {
      setMediaFiles(bucketFiles);
    }
  }, [bucketFiles, mediaFiles.length]);

  // Handle product load error
  useEffect(() => {
    if (isProductError) {
      toast.error(t("loadError"));
      router.push("/dashboard/my-listings");
    }
  }, [isProductError, t, router]);

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

  const onSubmit = async (data: EditListingFormData) => {
    if (!user?.id) {
      toast.error(t("userNotFound"));
      router.push(locale === "en" ? "/login" : `/${locale}/login`);
      return;
    }
    if (!sellerId) {
      toast.error(t("sellerNotFound"));
      return;
    }
    if (!product?.locationId) {
      toast.error(t("locationNotFound"));
      return;
    }

    setIsSaving(true);

    try {
      const slug = generateSlug(data.title);

      await LivestockTradingAPI.Products.Update.Request({
        id: productId,
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
        locationId: product.locationId,
        status: product.status,
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
        mediaBucketId: mediaBucketId || EMPTY_GUID,
        coverImageFileId: coverImageFileId || EMPTY_GUID,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success(t("updateSuccess"));
      router.push("/dashboard/my-listings");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
      const errorMessage = err.response?.data?.error?.message
        || err.response?.data?.message
        || err.message
        || t("updateFailed");
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProductLoading) {
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
      <form onSubmit={formSubmit(onSubmit)}>
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
