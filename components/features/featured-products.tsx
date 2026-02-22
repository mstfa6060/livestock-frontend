"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { ProductCard, type Product } from "@/components/features/product-card";
import { AppConfig } from "@/config/livestock-config";
import { ArrowRight } from "lucide-react";

export function FeaturedProducts() {
  const t = useTranslations("home.featured");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await LivestockTradingAPI.Products.Search.Request({
          query: "",
          countryCode: "TR",
          city: "",
          currency: "TRY",
          sortBy: "createdAt",
          sorting: {
            key: "createdAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          pageRequest: { currentPage: 1, perPageCount: 8, listAll: false },
        });

        setProducts(
          response.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            shortDescription: p.shortDescription,
            categoryId: p.categoryId,
            basePrice: p.basePrice as number,
            currency: p.currency,
            discountedPrice: p.discountedPrice as number | null,
            stockQuantity: p.stockQuantity,
            isInStock: p.isInStock,
            sellerId: p.sellerId,
            locationCity: p.locationCity,
            locationCountryCode: p.locationCountryCode,
            status: p.status,
            condition: p.condition,
            viewCount: p.viewCount,
            averageRating: p.averageRating as number | null,
            reviewCount: p.reviewCount,
            createdAt: p.createdAt,
            imageUrl: p.coverImageUrl ? `${AppConfig.FileStorageBaseUrl}${p.coverImageUrl}` : undefined,
          }))
        );
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <Button variant="outline" asChild>
            <Link href="/products">
              {t("viewAll")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
