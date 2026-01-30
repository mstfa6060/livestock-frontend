"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { MainHeader } from "@/components/layout/main-header";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useSelectedCountry } from "@/components/layout/country-switcher";

type SortOption = "newest" | "oldest" | "priceAsc" | "priceDesc" | "popular";

const ITEMS_PER_PAGE = 12;

export default function ProductsPage() {
  const t = useTranslations("products");
  const searchParams = useSearchParams();
  const selectedCountry = useSelectedCountry();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const categoryFilter = searchParams.get("category");

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const sortingKey = {
          newest: "createdAt",
          oldest: "createdAt",
          priceAsc: "basePrice",
          priceDesc: "basePrice",
          popular: "viewCount",
        }[sortBy];

        const sortingDirection =
          sortBy === "oldest" || sortBy === "priceAsc"
            ? LivestockTradingAPI.Enums.XSortingDirection.Ascending
            : LivestockTradingAPI.Enums.XSortingDirection.Descending;

        const response = await LivestockTradingAPI.Products.All.Request({
          countryCode: selectedCountry?.code || "TR",
          sorting: {
            key: sortingKey,
            direction: sortingDirection,
          },
          filters: categoryFilter
            ? [
                {
                  key: "categoryId",
                  type: "guid",
                  isUsed: true,
                  values: [categoryFilter],
                  min: {},
                  max: {},
                  conditionType: "equals",
                },
              ]
            : [],
          pageRequest: {
            currentPage: currentPage,
            perPageCount: ITEMS_PER_PAGE,
            listAll: false,
          },
        });

        // Transform API response to Product type
        const transformedProducts: Product[] = response.map((item) => ({
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
          imageUrl: undefined, // API doesn't return image in list
        }));

        setProducts(transformedProducts);
        setTotalProducts(transformedProducts.length); // API should return total count
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [sortBy, currentPage, categoryFilter, selectedCountry?.code]);

  // Filter products by search query (client-side)
  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          {totalProducts > 0 && (
            <p className="text-muted-foreground">
              {t("showing", {
                from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                to: Math.min(currentPage * ITEMS_PER_PAGE, totalProducts),
                total: totalProducts,
              })}
            </p>
          )}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sortOptions.newest")}</SelectItem>
              <SelectItem value="oldest">{t("sortOptions.oldest")}</SelectItem>
              <SelectItem value="priceAsc">{t("sortOptions.priceAsc")}</SelectItem>
              <SelectItem value="priceDesc">{t("sortOptions.priceDesc")}</SelectItem>
              <SelectItem value="popular">{t("sortOptions.popular")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Button (for mobile) */}
          <Button variant="outline" className="sm:hidden">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {t("filters")}
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">{t("noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {t("common:back")}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {t("common:next")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
