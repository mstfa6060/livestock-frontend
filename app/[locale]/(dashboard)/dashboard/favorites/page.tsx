"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { AppConfig } from "@/config/livestock-config";
import { queryKeys } from "@/lib/query-keys";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: queryKeys.favorites.list(user?.id ?? ""),
    queryFn: async () => {
      const favoritesData = await LivestockTradingAPI.FavoriteProducts.All.Request({
        sorting: { key: "addedAt", direction: 1 },
        filters: [],
        pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
      });

      const productIds = favoritesData.map((f) => f.productId);
      if (productIds.length === 0) return [];

      // Single batch request instead of N individual Detail calls
      const products = await LivestockTradingAPI.Products.All.Request({
        countryCode: "",
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          { key: "id", type: "guid", isUsed: true, values: productIds, min: {}, max: {}, conditionType: "equals" },
        ],
        pageRequest: { currentPage: 1, perPageCount: productIds.length, listAll: false },
      });

      return products.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        categoryId: p.categoryId,
        brandId: p.brandId || undefined,
        basePrice: p.basePrice as number,
        currency: p.currency,
        discountedPrice: p.discountedPrice as number | undefined,
        stockQuantity: p.stockQuantity,
        isInStock: p.isInStock,
        sellerId: p.sellerId,
        locationId: p.locationId?.toString() || "",
        locationCountryCode: p.locationCountryCode || "",
        locationCity: p.locationCity || "",
        status: p.status,
        condition: p.condition,
        viewCount: p.viewCount,
        averageRating: p.averageRating as number | undefined,
        reviewCount: p.reviewCount,
        createdAt: new Date(p.createdAt),
        imageUrl: p.coverImageUrl
          ? `${AppConfig.FileStorageBaseUrl}${p.coverImageUrl}`
          : undefined,
      })) as Product[];
    },
    enabled: !!user?.id,
  });

  const handleRemoveFavorite = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(user?.id ?? "") });
  };

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      {/* Favorites Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-4">{t("noFavorites")}</p>
          <Button asChild>
            <Link href="/products">{t("browseProducts")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={true}
              onFavorite={handleRemoveFavorite}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
