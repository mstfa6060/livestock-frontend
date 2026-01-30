"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { ImageGallery } from "@/components/features/image-gallery";
import { PriceDisplay } from "@/components/features/price-display";
import { SellerCard, Seller } from "@/components/features/seller-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

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

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock images - in production, fetch from ProductImages API
  const [images] = useState<string[]>([]);

  // Mock seller - in production, fetch from Sellers API
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Note: API uses ID, but we have slug. In production, you'd have a slug-to-id lookup
        // or the API would support slug-based queries
        const response = await LivestockTradingAPI.Products.Detail.Request({
          id: slug, // This should be the actual product ID
        });

        setProduct({
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
        });

        // Mock seller data
        setSeller({
          id: response.sellerId,
          name: response.sellerName,
          isVerified: true,
          rating: 4.5,
          reviewCount: 23,
          productCount: 15,
          memberSince: new Date("2022-01-01"),
          location: "Istanbul, Turkey",
        });
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Product not found");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleContact = () => {
    // Navigate to messages or open contact modal
    console.log("Contact seller:", seller?.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-[4/3] bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-background">
      <MainHeader />

      <main className="container mx-auto px-4 py-8">
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
                    <span className="text-muted-foreground">Kategori</span>
                    <p className="font-medium">{product.categoryName}</p>
                  </div>
                  {product.brandName && (
                    <div>
                      <span className="text-muted-foreground">Marka</span>
                      <p className="font-medium">{product.brandName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Durum</span>
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
                      ({product.reviewCount} degerlendirme)
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
                      {new Date(product.publishedAt).toLocaleDateString("tr-TR")}
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
                  Istanbul, Turkey
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" size="lg" onClick={handleContact}>
                    Satici ile Iletisime Gec
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsFavorite(!isFavorite)}
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
                    <Button variant="outline" size="icon">
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
      </main>
    </div>
  );
}
