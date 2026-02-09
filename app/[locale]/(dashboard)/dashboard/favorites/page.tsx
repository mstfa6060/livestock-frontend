"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Product[]>([]);

  // Fetch favorite products
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get all favorites with pagination
        const favoritesData = await LivestockTradingAPI.FavoriteProducts.All.Request({
          sorting: { key: "addedAt", direction: 1 }, // Descending
          filters: [],
          pageRequest: {
            currentPage: 1,
            perPageCount: 100,
            listAll: true,
          },
        });

        // Get product IDs
        const productIds = favoritesData.map(f => f.productId);

        // Fetch product details for each favorite
        if (productIds.length > 0) {
          const productPromises = productIds.map(id =>
            LivestockTradingAPI.Products.Detail.Request({ id })
          );

          const products = await Promise.all(productPromises);

          // Map to Product interface
          const mappedProducts: Product[] = products.map(p => ({
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
            locationCountryCode: "", // Detail endpoint doesn't return this
            locationCity: "", // Detail endpoint doesn't return this
            status: p.status,
            condition: p.condition,
            viewCount: p.viewCount,
            averageRating: p.averageRating as number | undefined,
            reviewCount: p.reviewCount,
            createdAt: new Date(p.createdAt),
            imageUrl: undefined, // Detail endpoint doesn't return images
          }));

          setFavorites(mappedProducts);
        }
      } catch {
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user, t]);

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
