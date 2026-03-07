"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Eye, Star, ImageOff } from "lucide-react";
import { PriceDisplay } from "./price-display";
import { useState, memo } from "react";
import { useFavoriteActions } from "@/hooks/queries/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  brandId?: string;
  basePrice: number;
  currency: string;
  discountedPrice?: number | null;
  stockQuantity?: number;
  isInStock: boolean;
  sellerId: string;
  locationId?: string;
  locationCountryCode?: string;
  locationCity: string;
  status: number;
  condition: number;
  viewCount: number;
  averageRating?: number | null;
  reviewCount: number;
  createdAt: Date;
  imageUrl?: string;
}

interface ProductCardProps {
  product: Product;
  onFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

// Product status mapping
const STATUS_MAP: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; bannerClass: string }> = {
  0: { label: "draft", variant: "secondary", bannerClass: "bg-slate-700/80" },
  1: { label: "active", variant: "default", bannerClass: "" },
  2: { label: "sold", variant: "destructive", bannerClass: "bg-red-800/85" },
  3: { label: "pending", variant: "outline", bannerClass: "bg-amber-700/80" },
};

// Product condition mapping
const CONDITION_MAP: Record<number, string> = {
  0: "new",
  1: "likeNew",
  2: "good",
  3: "fair",
};

export const ProductCard = memo(function ProductCard({ product, onFavorite, isFavorite = false }: ProductCardProps) {
  const t = useTranslations("products");
  const tpd = useTranslations("productDetail");
  const { user } = useAuth();
  const { isFavorite: isFavoriteCheck, toggleFavorite } = useFavoriteActions(user?.id ?? "");
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Use query state or prop
  const favorite = isFavoriteCheck(product.id) || isFavorite;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Require authentication
    if (!user) {
      toast.error(t("loginToFavorite"));
      return;
    }

    setIsTogglingFavorite(true);

    try {
      const newState = await toggleFavorite(product.id);

      // Show success toast
      if (newState) {
        toast.success(t("addedToFavorites"));
      } else {
        toast.success(t("removedFromFavorites"));
      }

      // Call optional callback
      onFavorite?.(product.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("favoriteError"));
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const status = STATUS_MAP[product.status] || STATUS_MAP[0];
  const condition = CONDITION_MAP[product.condition] || "new";

  // Check if we have a valid image URL
  const hasImage = product.imageUrl && product.imageUrl.length > 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden border hover:shadow-xl transition-all duration-300 h-full bg-card">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {hasImage ? (
            <Image
              src={product.imageUrl!}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <ImageOff className="h-12 w-12 text-muted-foreground/30" />
              <span className="text-xs text-muted-foreground/40 mt-2">{tpd("noImage")}</span>
            </div>
          )}

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm rounded-full h-9 w-9"
            onClick={handleFavorite}
            disabled={isTogglingFavorite}
            aria-label={favorite ? t("removedFromFavorites") : t("addedToFavorites")}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                favorite ? "fill-red-500 text-red-500" : "text-gray-500"
              } ${isTogglingFavorite ? "opacity-50" : ""}`}
            />
          </Button>

          {/* Condition Badge - Bottom left */}
          <Badge variant="secondary" className="absolute bottom-2 left-2 bg-white/90 text-foreground shadow-sm text-xs">
            {t(`condition.${condition}`)}
          </Badge>

          {/* Sold / Draft / Pending Banner */}
          {product.status !== 1 && (
            <div className={`absolute top-0 inset-x-0 ${status.bannerClass} py-1.5 text-center`}>
              <span className="text-white font-semibold text-xs uppercase tracking-wider">
                {t(`status.${status.label}`)}
              </span>
            </div>
          )}

          {/* Out of Stock Banner */}
          {!product.isInStock && product.status === 1 && (
            <div className="absolute top-0 inset-x-0 bg-slate-800/80 py-1.5 text-center">
              <span className="text-white font-semibold text-xs uppercase tracking-wider">
                {t("outOfStock")}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug">
            {product.title}
          </h3>

          {/* Price - Prominent */}
          <PriceDisplay
            price={product.basePrice}
            currency={product.currency}
            discountedPrice={product.discountedPrice}
            size="md"
            className="mb-3"
          />

          {/* Location & Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              <span>{product.locationCity}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Rating */}
              {product.averageRating != null && product.reviewCount > 0 && (
                <div className="flex items-center gap-0.5 text-xs">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                </div>
              )}

              {/* Views */}
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                <span>{product.viewCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

// Skeleton for loading state
export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="h-5 bg-muted animate-pulse rounded" />
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
