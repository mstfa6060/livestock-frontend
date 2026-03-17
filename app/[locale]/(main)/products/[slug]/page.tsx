"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import dynamic from "next/dynamic";
const ImageGallery = dynamic(() => import("@/components/features/image-gallery").then(mod => ({ default: mod.ImageGallery })), { ssr: false });
import { PriceDisplay } from "@/components/features/price-display";
import { SellerCard, Seller } from "@/components/features/seller-card";
import { ProductCard } from "@/components/features/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Share2,
  Flag,
  MapPin,
  Eye,
  Calendar,
  Truck,
  Package,
  Star,
  ChevronRight,
  MessageSquare,
  HandCoins,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { AppConfig } from "@/config/livestock-config";
import { useFavoriteActions } from "@/hooks/queries/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProductReviews } from "@/components/features/product-reviews";
const ProductAnimalInfo = dynamic(() => import("@/components/features/product-animal-info").then(mod => ({ default: mod.ProductAnimalInfo })), { ssr: false });
import { ProductVariants } from "@/components/features/product-variants";
import { ProductPrices } from "@/components/features/product-prices";
const MakeOfferDialog = dynamic(() => import("@/components/features/make-offer-dialog").then(mod => ({ default: mod.MakeOfferDialog })), { ssr: false });
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useProductList } from "@/hooks/queries/useProducts";
import { useSellerDetail } from "@/hooks/queries/useSellers";
import { useMediaBucket } from "@/hooks/queries/useProductSubresources";
import { useSelectedCountry } from "@/components/layout/country-switcher";

interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName: string;
  basePrice: number;
  currency: string;
  discountedPrice?: number;
  priceUnit: string;
  stockQuantity: number;
  stockUnit: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  isInStock: boolean;
  sellerId: string;
  sellerName: string;
  locationId: string;
  status: number;
  condition: number;
  isShippingAvailable: boolean;
  shippingCost?: number;
  isInternationalShipping: boolean;
  weight?: number;
  weightUnit: string;
  attributes: string;
  viewCount: number;
  favoriteCount: number;
  averageRating?: number;
  reviewCount: number;
  publishedAt?: Date;
  createdAt: Date;
  mediaBucketId?: string;
  // Viewer currency price from backend
  viewerPrice?: number;
  viewerDiscountedPrice?: number;
  viewerCurrencyCode?: string;
  viewerCurrencySymbol?: string;
}

const CONDITION_MAP: Record<number, string> = {
  0: "new",
  1: "likeNew",
  2: "good",
  3: "fair",
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations("productDetail");
  const tp = useTranslations("products");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const selectedCountry = useSelectedCountry();
  const viewerCurrencyCode = selectedCountry?.defaultCurrencyCode || "";
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavoriteActions(user?.id ?? "");

  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  // Step 1: Resolve slug → product ID (only if slug is not a GUID)
  // Pass empty countryCode to avoid country-based filtering that could hide products
  const { data: slugResults } = useProductList(
    { slug, perPageCount: 1, countryCode: "" },
    { enabled: !isGuid && !!slug }
  );
  const resolvedId = isGuid ? slug : slugResults?.[0]?.id;

  // Step 2: Fetch full product detail with viewer currency (enabled when we have an ID)
  const {
    data: productRaw,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery({
    queryKey: [...queryKeys.products.detail(resolvedId ?? ""), viewerCurrencyCode],
    queryFn: async () => {
      const response = await LivestockTradingAPI.Products.Detail.Request({
        id: resolvedId!,
        viewerCurrencyCode: viewerCurrencyCode || undefined,
      });

      return {
        id: response.id,
        title: response.title,
        slug: response.slug,
        description: response.description,
        shortDescription: response.shortDescription,
        categoryId: response.categoryId,
        categoryName: response.categoryName,
        brandId: response.brandId || undefined,
        brandName: response.brandName,
        basePrice: response.basePrice as number,
        currency: response.currency,
        discountedPrice: response.discountedPrice as number | undefined,
        priceUnit: response.priceUnit,
        stockQuantity: response.stockQuantity,
        stockUnit: response.stockUnit,
        minOrderQuantity: response.minOrderQuantity || undefined,
        maxOrderQuantity: response.maxOrderQuantity || undefined,
        isInStock: response.isInStock,
        sellerId: response.sellerId,
        sellerName: response.sellerName,
        locationId: response.locationId,
        status: response.status,
        condition: response.condition,
        isShippingAvailable: response.isShippingAvailable,
        shippingCost: response.shippingCost as number | undefined,
        isInternationalShipping: response.isInternationalShipping,
        weight: response.weight as number | undefined,
        weightUnit: response.weightUnit,
        attributes: response.attributes,
        viewCount: response.viewCount,
        favoriteCount: response.favoriteCount,
        averageRating: response.averageRating as number | undefined,
        reviewCount: response.reviewCount,
        publishedAt: response.publishedAt,
        createdAt: response.createdAt,
        mediaBucketId: (response as unknown as Record<string, unknown>).mediaBucketId as string | undefined,
        viewerPrice: response.viewerPrice as number | undefined,
        viewerDiscountedPrice: response.viewerDiscountedPrice as number | undefined,
        viewerCurrencyCode: response.viewerCurrencyCode || undefined,
        viewerCurrencySymbol: response.viewerCurrencySymbol || undefined,
      } satisfies ProductDetail;
    },
    enabled: !!resolvedId,
  });

  const product = productRaw ?? null;

  // Step 3: Parallel dependent queries (all enabled when product is loaded)
  const { data: images = [] } = useMediaBucket(product?.mediaBucketId, {
    enabled: !!product?.mediaBucketId,
  });

  const { data: similarProductsRaw = [] } = useProductList(
    {
      categoryId: product?.categoryId,
      perPageCount: 4,
    },
    { enabled: !!product?.categoryId }
  );

  const similarProducts = similarProductsRaw
    .filter((p) => p.id !== product?.id)
    .slice(0, 3);

  const { data: sellerRaw } = useSellerDetail(product?.sellerId ?? "", {
    enabled: !!product?.sellerId,
  });

  const seller: Seller | null = sellerRaw
    ? {
        id: sellerRaw.id,
        name: sellerRaw.businessName || product?.sellerName || "",
        isVerified: sellerRaw.isVerified,
        rating: sellerRaw.averageRating || 0,
        reviewCount: sellerRaw.totalReviews,
        productCount: sellerRaw.totalSales,
        memberSince: sellerRaw.createdAt,
        location: sellerRaw.phone
          ? sellerRaw.description
          : t("defaultLocation"),
      }
    : product
      ? {
          id: product.sellerId,
          name: product.sellerName,
          isVerified: false,
          rating: 0,
          reviewCount: 0,
          productCount: 0,
          memberSince: new Date(),
          location: t("defaultLocation"),
        }
      : null;

  const isFavorite = product ? checkIsFavorite(product.id) : false;

  // Track product view (fire-and-forget)
  useEffect(() => {
    if (product?.id && user?.id) {
      LivestockTradingAPI.ProductViewHistories.Create.Request({
        userId: user.id,
        productId: product.id,
        viewSource: "web",
      }).catch((error) => {
        console.warn("Failed to track product view:", error);
      });
    }
  }, [product?.id, user?.id]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }

    if (!product) return;

    try {
      await toggleFavorite(product.id);
      toast.success(isFavorite ? t("removedFromFavorites") : t("addedToFavorites"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("favoriteError"));
    }
  };

  const handleShare = () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("utm_source", "share");
    shareUrl.searchParams.set("utm_medium", "web");
    const shareUrlStr = shareUrl.toString();

    if (navigator.share) {
      navigator.share({
        title: product?.title,
        url: shareUrlStr,
      });
    } else {
      navigator.clipboard.writeText(shareUrlStr);
      toast.success(t("linkCopied"));
    }
  };

  const [isContacting, setIsContacting] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  const handleContact = async () => {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }
    if (!product || !seller) return;

    setIsContacting(true);
    try {
      const response = await LivestockTradingAPI.Conversations.Create.Request({
        participantUserId1: user.id,
        participantUserId2: product.sellerId,
        productId: product.id,
        subject: product.title,
        status: 0,
      });

      // Navigate to the conversation
      router.push(`/dashboard/messages?conversation=${response.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("contactError"));
    } finally {
      setIsContacting(false);
    }
  };

  const isLoading = isProductLoading || (!isGuid && !slugResults);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <main id="main-content" className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                  <Separator />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("productNotFound")}</h1>
          <Button onClick={() => window.history.back()}>{tc("back")}</Button>
        </div>
      </div>
    );
  }

  const condition = CONDITION_MAP[product.condition] || "new";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            {t("breadcrumb.home")}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-foreground transition-colors">
            {t("breadcrumb.products")}
          </Link>
          {product.categoryName && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link
                href={`/products?category=${product.categoryId}`}
                className="hover:text-foreground transition-colors"
              >
                {product.categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <ImageGallery images={images} alt={product.title} />

            {/* Title & Actions (Mobile) */}
            <div className="lg:hidden">
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <PriceDisplay
                price={product.basePrice}
                currency={product.currency}
                discountedPrice={product.discountedPrice}
                convertedPrice={product.viewerPrice}
                convertedDiscountedPrice={product.viewerDiscountedPrice}
                convertedCurrencyCode={product.viewerCurrencyCode}
                convertedCurrencySymbol={product.viewerCurrencySymbol}
                size="lg"
                className="mb-4"
              />
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>{t("description")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>{t("specifications")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">{t("category")}</span>
                    <p className="font-medium">{product.categoryName}</p>
                  </div>
                  {product.brandName && (
                    <div>
                      <span className="text-muted-foreground">{t("brand")}</span>
                      <p className="font-medium">{product.brandName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t("condition")}</span>
                    <p className="font-medium">{tp(`condition.${condition}`)}</p>
                  </div>
                  {product.weight && (
                    <div>
                      <span className="text-muted-foreground">{t("weight")}</span>
                      <p className="font-medium">
                        {product.weight} {product.weightUnit}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t("stock")}</span>
                    <p className="font-medium">
                      {t("inStock", { count: product.stockQuantity })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <ProductVariants productId={product.id} currency={product.currency} />

            {/* Multi-currency Prices */}
            <ProductPrices productId={product.id} />

            {/* Animal / Product Info */}
            <ProductAnimalInfo productId={product.id} />

            {/* Reviews */}
            <ProductReviews
              productId={product.id}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          </div>

          {/* Right Column - Price, Seller, Actions */}
          <div className="space-y-6">
            {/* Price Card (Desktop) */}
            <Card className="hidden lg:block sticky top-24">
              <CardContent className="pt-6">
                {/* Title */}
                <h1 className="text-xl font-bold mb-2">{product.title}</h1>

                {/* Category & Condition */}
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary">{product.categoryName}</Badge>
                  <Badge variant="outline">{tp(`condition.${condition}`)}</Badge>
                </div>

                {/* Price */}
                <PriceDisplay
                  price={product.basePrice}
                  currency={product.currency}
                  discountedPrice={product.discountedPrice}
                  convertedPrice={product.viewerPrice}
                  convertedDiscountedPrice={product.viewerDiscountedPrice}
                  convertedCurrencyCode={product.viewerCurrencyCode}
                  convertedCurrencySymbol={product.viewerCurrencySymbol}
                  size="lg"
                  className="mb-4"
                />

                {/* Rating */}
                {product.averageRating != null && product.reviewCount > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({product.reviewCount} {t("reviews")})
                    </span>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {product.viewCount} {t("views")}
                  </div>
                  {product.publishedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(product.publishedAt).toLocaleDateString(locale)}
                    </div>
                  )}
                </div>

                {/* Shipping Info */}
                <div className="flex items-center gap-2 text-sm mb-4">
                  {product.isShippingAvailable ? (
                    <>
                      <Truck className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">{t("shippingAvailable")}</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("noShipping")}</span>
                    </>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <MapPin className="h-4 w-4" />
                  {t("location")}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" size="lg" onClick={handleContact} disabled={isContacting}>
                    {isContacting ? t("contacting") || "..." : t("contactSeller")}
                  </Button>
                  {user?.id !== product.sellerId && (
                    <Button
                      className="w-full"
                      size="lg"
                      variant="secondary"
                      onClick={() => {
                        if (!user) { toast.error(t("loginRequired")); return; }
                        setShowOfferDialog(true);
                      }}
                    >
                      <HandCoins className="h-4 w-4 mr-2" />
                      {t("makeOffer")}
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleFavoriteToggle}
                    >
                      <Heart
                        className={`h-4 w-4 mr-2 ${
                          isFavorite ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                      {isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare} aria-label={t("share")}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" aria-label={t("report")}>
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            {seller && (
              <SellerCard seller={seller} onContact={handleContact} />
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t("similarProducts")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProducts.map((similarProduct) => (
                <ProductCard key={similarProduct.id} product={similarProduct} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleContact} disabled={isContacting}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {isContacting ? t("contacting") : t("contactSeller")}
          </Button>
          {user?.id !== product.sellerId && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (!user) { toast.error(t("loginRequired")); return; }
                setShowOfferDialog(true);
              }}
              aria-label={t("makeOffer")}
            >
              <HandCoins className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleFavoriteToggle} aria-label={isFavorite ? t("removeFromFavorites") : t("addToFavorites")}>
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare} aria-label={t("share")}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SimpleFooter />

      {/* Make Offer Dialog */}
      {product && (
        <MakeOfferDialog
          isOpen={showOfferDialog}
          onClose={() => setShowOfferDialog(false)}
          productId={product.id}
          sellerId={product.sellerId}
          productTitle={product.title}
          basePrice={product.basePrice}
          currency={product.currency}
          maxQuantity={product.stockQuantity}
        />
      )}
    </div>
  );
}
