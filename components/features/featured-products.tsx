"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/features/product-card";
import { ArrowRight } from "lucide-react";
import { useProductSearch } from "@/hooks/queries/useProducts";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useSelectedCountry } from "@/components/layout/country-switcher";

export function FeaturedProducts() {
  const t = useTranslations("home.featured");
  const selectedCountry = useSelectedCountry();

  const { data: products = [], isLoading } = useProductSearch({
    query: "",
    countryCode: selectedCountry?.code || "",
    city: "",
    currency: selectedCountry?.defaultCurrencyCode || "",
    sortBy: "createdAt",
    sortDirection: LivestockTradingAPI.Enums.XSortingDirection.Descending,
    currentPage: 1,
    perPageCount: 8,
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t("title")}</h2>
          </div>
          <Button variant="outline" className="shadow-sm" asChild>
            <Link href="/products">
              {t("viewAll")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
