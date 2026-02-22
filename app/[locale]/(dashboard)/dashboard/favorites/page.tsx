"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { AppConfig } from "@/config/livestock-config";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchFavoritesPage = useCallback(async (page: number) => {
    if (!user) return [];

    const favoritesData = await LivestockTradingAPI.FavoriteProducts.All.Request({
      sorting: { key: "addedAt", direction: 1 },
      filters: [],
      pageRequest: {
        currentPage: page,
        perPageCount: PAGE_SIZE,
        listAll: false,
      },
    });

    setHasMore(favoritesData.length === PAGE_SIZE);

    const productIds = favoritesData.map(f => f.productId);
    if (productIds.length === 0) return [];

    const products = await Promise.all(
      productIds.map(id => LivestockTradingAPI.Products.Detail.Request({ id }))
    );

    return products.map(p => ({
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
      locationCountryCode: "",
      locationCity: "",
      status: p.status,
      condition: p.condition,
      viewCount: p.viewCount,
      averageRating: p.averageRating as number | undefined,
      reviewCount: p.reviewCount,
      createdAt: new Date(p.createdAt),
      imageUrl: p.coverImageUrl ? `${AppConfig.FileStorageBaseUrl}${p.coverImageUrl}` : undefined,
    })) as Product[];
  }, [user]);

  // Fetch first page
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const mappedProducts = await fetchFavoritesPage(1);
        setFavorites(mappedProducts);
        setCurrentPage(1);
      } catch {
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user, t, fetchFavoritesPage]);

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const moreProducts = await fetchFavoritesPage(nextPage);
      setFavorites(prev => [...prev, ...moreProducts]);
      setCurrentPage(nextPage);
    } catch {
      toast.error(t("fetchError"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRemoveFavorite = (productId: string) => {
    // Remove from local state (optimistic update)
    setFavorites(prev => prev.filter(p => p.id !== productId));
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
        <>
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
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("loadingMore")}
                  </>
                ) : (
                  t("loadMore")
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
