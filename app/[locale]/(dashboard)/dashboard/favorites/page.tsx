"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const t = useTranslations("favorites");

  const [isLoading] = useState(false);

  // Mock data - in production, fetch from API
  const favorites: Product[] = [];

  const handleRemoveFavorite = (productId: string) => {
    console.log("Remove from favorites:", productId);
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
