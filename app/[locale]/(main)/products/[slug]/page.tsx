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
import { ProductCard, Product } from "@/components/features/product-card";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";
import { useFavoritesStore } from "@/stores/useFavoritesStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getProductCoverImages } from "@/lib/product-images";
import { ProductReviews } from "@/components/features/product-reviews";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

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
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavoritesStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);

  const isFavorite = product ? checkIsFavorite(product.id) : false;

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if slug is a valid GUID (UUID format)
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

        let productId: string;

        if (isGuid) {
          // If it's a GUID, use it directly
          productId = slug;
        } else {
          // Otherwise, search by slug
          const searchResponse = await LivestockTradingAPI.Products.All.Request({
            countryCode: "TR",
            sorting: { key: "createdAt", direction: 1 },
            filters: [
              {
                key: "slug",
                type: "string",
                isUsed: true,
                values: [slug],
                min: {},
                max: {},
                conditionType: "equals",
              },
            ],
            pageRequest: { currentPage: 1, perPageCount: 1, listAll: false },
          });

          if (searchResponse.length === 0) {
            throw new Error("Product not found");
          }

          productId = searchResponse[0].id;
        }

        // Fetch full details by ID
        const response = await LivestockTradingAPI.Products.Detail.Request({
          id: productId,
        });

        const productData = {
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
        };

        setProduct(productData);

        // Fetch media bucket, similar products, and seller data in parallel
        const mediaBucketId = (response as any).mediaBucketId;

        const [imagesResult, similarResult, sellerResult] = await Promise.allSettled([
          // 1. Fetch product images from media bucket
          mediaBucketId
            ? FileProviderAPI.Buckets.Detail.Request({
                bucketId: mediaBucketId,
                changeId: EMPTY_GUID,
              })
            : Promise.resolve(null),

          // 2. Fetch similar products from same category
          LivestockTradingAPI.Products.All.Request({
            countryCode: "TR",
            sorting: { key: "createdAt", direction: 1 },
            filters: [
              {
                key: "categoryId",
                type: "guid",
                isUsed: true,
                values: [response.categoryId],
                min: {},
                max: {},
                conditionType: "equals",
              },
            ],
            pageRequest: { currentPage: 1, perPageCount: 4, listAll: false },
          }),

          // 3. Fetch seller data
          LivestockTradingAPI.Sellers.Detail.Request({
            id: response.sellerId,
          }),
        ]);

        // Process images result
        if (imagesResult.status === "fulfilled" && imagesResult.value) {
          const bucketResponse = imagesResult.value;
          if (bucketResponse.files && bucketResponse.files.length > 0) {
            const imageUrls = bucketResponse.files
              .filter((file: any) => !file.contentType?.startsWith("video/"))
              .map((file: any) => {
                if (file.variants && file.variants.length > 0) {
                  return file.variants[0].url;
                }
                return `${AppConfig.FileStorageBaseUrl}${file.path}`;
              });
            setImages(imageUrls);
          }
        }

        // Process similar products result
        if (similarResult.status === "fulfilled") {
          const similarProductsData = similarResult.value
            .filter((p) => p.id !== response.id)
            .slice(0, 3)
            .map((item) => ({
              id: item.id,
              title: item.title,
              slug: item.slug,
              shortDescription: item.shortDescription,
              categoryId: item.categoryId,
              brandId: item.brandId || undefined,
              basePrice: item.basePrice as number,
              currency: item.currency,
              discountedPrice: item.discountedPrice as number | undefined,
              stockQuantity: item.stockQuantity,
              isInStock: item.isInStock,
              sellerId: item.sellerId,
              locationId: item.locationId,
              locationCountryCode: item.locationCountryCode,
              locationCity: item.locationCity,
              status: item.status,
              condition: item.condition,
              viewCount: item.viewCount,
              averageRating: item.averageRating as number | undefined,
              reviewCount: item.reviewCount,
              createdAt: item.createdAt,
              imageUrl: undefined,
            }));

          setSimilarProducts(similarProductsData);

          // Fetch cover images for similar products (fire-and-forget)
          const similarIds = similarProductsData.map((p) => p.id);
          if (similarIds.length > 0) {
            getProductCoverImages(similarIds).then((imageMap) => {
              setSimilarProducts((prev) =>
                prev.map((p) => ({ ...p, imageUrl: imageMap[p.id] || p.imageUrl }))
              );
            });
          }
        }

        // Process seller result
        if (sellerResult.status === "fulfilled") {
          const sellerResponse = sellerResult.value;
          setSeller({
            id: sellerResponse.id,
            name: sellerResponse.businessName || response.sellerName,
            isVerified: sellerResponse.isVerified,
            rating: sellerResponse.averageRating || 0,
            reviewCount: sellerResponse.totalReviews,
            productCount: sellerResponse.totalSales,
            memberSince: sellerResponse.createdAt,
            location: sellerResponse.phone ? sellerResponse.description : t("defaultLocation"),
          });
        } else {
          // Fallback to basic seller info from product
          setSeller({
            id: response.sellerId,
            name: response.sellerName,
            isVerified: false,
            rating: 0,
            reviewCount: 0,
            productCount: 0,
            memberSince: new Date(),
            location: t("defaultLocation"),
          });
        }
      } catch {
        setError(t("productNotFound"));
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, t]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }

    if (!product) return;

    try {
      await toggleFavorite(product.id, user.id);
      toast.success(isFavorite ? t("removedFromFavorites") : t("addedToFavorites"));
    } catch {
      // Handled by store
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("linkCopied"));
    }
  };

  const [isContacting, setIsContacting] = useState(false);

  const handleContact = async () => {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }
    if (!product || !seller) return;

    setIsContacting(true);
    try {
      const response = await LivestockTradingAPI.Conversations.StartWithProduct.Request({
        productId: product.id,
        sellerId: product.sellerId,
        buyerUserId: user.id,
        initialMessage: t("inquiryMessage", { title: product.title }),
      });

      // Navigate to the conversation
      router.push(`/dashboard/messages?conversation=${response.conversationId}`);
    } catch {
      toast.error(t("contactError"));
    } finally {
      setIsContacting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <main className="container mx-auto px-4 py-8">
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Product not found"}</h1>
          <Button onClick={() => window.history.back()}>{tc("back")}</Button>
        </div>
      </div>
    );
  }

  const condition = CONDITION_MAP[product.condition] || "new";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
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
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title={t("report")}>
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
          <Button variant="outline" size="icon" onClick={handleFavoriteToggle}>
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SimpleFooter />
    </div>
  );
}
