"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  SlidersHorizontal,
  X,
  Package,
  ArrowUpDown,
} from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useSelectedCountry } from "@/components/layout/country-switcher";

type SortOption = "newest" | "oldest" | "priceAsc" | "priceDesc" | "popular";
type ConditionOption = "all" | "new" | "likeNew" | "good" | "fair";

const ITEMS_PER_PAGE = 12;

const CONDITION_MAP: Record<string, number> = {
  new: 0,
  likeNew: 1,
  good: 2,
  fair: 3,
};

interface Category {
  id: string;
  name: string;
}

export default function SearchPage() {
  const t = useTranslations("search");
  const tp = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCountry = useSelectedCountry();

  // URL params
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const conditionParam = (searchParams.get("condition") || "all") as ConditionOption;
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortParam = (searchParams.get("sort") || "newest") as SortOption;
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Local state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(queryParam);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter state (local until applied)
  const [localCategory, setLocalCategory] = useState(categoryParam);
  const [localCondition, setLocalCondition] = useState(conditionParam);
  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset page when filters change
      if (!updates.page) {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await LivestockTradingAPI.Categories.All.Request({
          languageCode: locale,
          sorting: { key: "name", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
          filters: [],
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: true },
        });
        setCategories(response.map((c) => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, [locale]);

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
        }[sortParam];

        const sortingDirection =
          sortParam === "oldest" || sortParam === "priceAsc"
            ? LivestockTradingAPI.Enums.XSortingDirection.Ascending
            : LivestockTradingAPI.Enums.XSortingDirection.Descending;

        // Build filters
        const filters: Array<{
          key: string;
          type: string;
          isUsed: boolean;
          values: string[];
          min: Record<string, unknown>;
          max: Record<string, unknown>;
          conditionType: string;
        }> = [];

        // Category filter
        if (categoryParam) {
          filters.push({
            key: "categoryId",
            type: "guid",
            isUsed: true,
            values: [categoryParam],
            min: {},
            max: {},
            conditionType: "equals",
          });
        }

        // Condition filter
        if (conditionParam && conditionParam !== "all") {
          filters.push({
            key: "condition",
            type: "int",
            isUsed: true,
            values: [CONDITION_MAP[conditionParam].toString()],
            min: {},
            max: {},
            conditionType: "equals",
          });
        }

        // Price range filter
        if (minPriceParam || maxPriceParam) {
          filters.push({
            key: "basePrice",
            type: "decimal",
            isUsed: true,
            values: [],
            min: minPriceParam ? { value: parseFloat(minPriceParam) } : {},
            max: maxPriceParam ? { value: parseFloat(maxPriceParam) } : {},
            conditionType: "between",
          });
        }

        const response = await LivestockTradingAPI.Products.All.Request({
          countryCode: selectedCountry?.code || "TR",
          sorting: {
            key: sortingKey,
            direction: sortingDirection,
          },
          filters,
          pageRequest: {
            currentPage: pageParam,
            perPageCount: ITEMS_PER_PAGE,
            listAll: false,
          },
        });

        // Transform and filter by search query
        let transformedProducts: Product[] = response.map((item) => ({
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

        // Client-side search filter
        if (queryParam) {
          const query = queryParam.toLowerCase();
          transformedProducts = transformedProducts.filter(
            (p) =>
              p.title.toLowerCase().includes(query) ||
              p.shortDescription.toLowerCase().includes(query)
          );
        }

        setProducts(transformedProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [queryParam, categoryParam, conditionParam, minPriceParam, maxPriceParam, sortParam, pageParam, selectedCountry?.code]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput });
  };

  // Apply filters
  const applyFilters = () => {
    updateParams({
      category: localCategory,
      condition: localCondition,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
    });
    setIsFiltersOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalCategory("");
    setLocalCondition("all");
    setLocalMinPrice("");
    setLocalMaxPrice("");
    updateParams({
      category: null,
      condition: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  // Count active filters
  const activeFilterCount = [
    categoryParam,
    conditionParam !== "all" ? conditionParam : "",
    minPriceParam,
    maxPriceParam,
  ].filter(Boolean).length;

  // Get category name
  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || "";
  };

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label>{t("filters.category")}</Label>
        <Select value={localCategory} onValueChange={setLocalCategory}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("filters.allCategories")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label>{t("filters.condition")}</Label>
        <Select value={localCondition} onValueChange={(v) => setLocalCondition(v as ConditionOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allConditions")}</SelectItem>
            <SelectItem value="new">{tp("condition.new")}</SelectItem>
            <SelectItem value="likeNew">{tp("condition.likeNew")}</SelectItem>
            <SelectItem value="good">{tp("condition.good")}</SelectItem>
            <SelectItem value="fair">{tp("condition.fair")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>{t("filters.priceRange")}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t("filters.min")}
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            min="0"
          />
          <Input
            type="number"
            placeholder={t("filters.max")}
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
            min="0"
          />
        </div>
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={applyFilters} className="flex-1">
          {t("filters.apply")}
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("placeholder")}
                className="pl-10"
              />
            </div>
            <Button type="submit">{t("searchButton")}</Button>
          </form>

          {/* Active filters */}
          {(queryParam || activeFilterCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {queryParam && (
                <Badge variant="secondary" className="gap-1">
                  {t("searchingFor")}: {queryParam}
                  <button onClick={() => { setSearchInput(""); updateParams({ q: null }); }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {categoryParam && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.category")}: {getCategoryName(categoryParam)}
                  <button onClick={() => updateParams({ category: null })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {conditionParam !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.condition")}: {tp(`condition.${conditionParam}`)}
                  <button onClick={() => updateParams({ condition: null })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(minPriceParam || maxPriceParam) && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.price")}: {minPriceParam || "0"} - {maxPriceParam || "∞"}
                  <button onClick={() => updateParams({ minPrice: null, maxPrice: null })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t("filters.clearAll")}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("filters.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? t("loading")
                  : t("resultsCount", { count: products.length })}
              </p>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {t("filters.title")}
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>{t("filters.title")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select
                  value={sortParam}
                  onValueChange={(v) => updateParams({ sort: v })}
                >
                  <SelectTrigger className="w-40">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{tp("sort.newest")}</SelectItem>
                    <SelectItem value="oldest">{tp("sort.oldest")}</SelectItem>
                    <SelectItem value="priceAsc">{tp("sort.priceAsc")}</SelectItem>
                    <SelectItem value="priceDesc">{tp("sort.priceDesc")}</SelectItem>
                    <SelectItem value="popular">{tp("sort.popular")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {t("noResults")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("tryDifferentSearch")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {products.length >= ITEMS_PER_PAGE && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={pageParam <= 1}
                  onClick={() => updateParams({ page: (pageParam - 1).toString() })}
                >
                  {tp("pagination.prev")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateParams({ page: (pageParam + 1).toString() })}
                >
                  {tp("pagination.next")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
