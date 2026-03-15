"use client";

import { useState, useCallback } from "react";
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
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { AppConfig } from "@/config/livestock-config";
import { getProductCoverImagesDirect } from "@/lib/product-images";
import { useSelectedCountry } from "@/components/layout/country-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCategories } from "@/hooks/queries/useCategories";

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

interface SearchFilterContentProps {
  categories: Category[];
  localCategory: string;
  setLocalCategory: (v: string) => void;
  localCondition: ConditionOption;
  setLocalCondition: (v: ConditionOption) => void;
  localMinPrice: string;
  setLocalMinPrice: (v: string) => void;
  localMaxPrice: string;
  setLocalMaxPrice: (v: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  t: (key: string) => string;
  tp: (key: string) => string;
}

function SearchFilterContent({
  categories,
  localCategory,
  setLocalCategory,
  localCondition,
  setLocalCondition,
  localMinPrice,
  setLocalMinPrice,
  localMaxPrice,
  setLocalMaxPrice,
  applyFilters,
  clearFilters,
  t,
  tp,
}: SearchFilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label>{t("filters.category")}</Label>
        <Select value={localCategory} onValueChange={setLocalCategory}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
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
}

export default function SearchPage() {
  const t = useTranslations("search");
  const tp = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCountry = useSelectedCountry();
  const { user } = useAuth();

  // URL params
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const conditionParam = (searchParams.get("condition") || "all") as ConditionOption;
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortParam = (searchParams.get("sort") || "newest") as SortOption;
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const queryClient = useQueryClient();

  // Local state
  const [searchInput, setSearchInput] = useState(queryParam);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Filter state (local until applied)
  const [localCategory, setLocalCategory] = useState(categoryParam || "all");
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

  // Fetch categories via React Query
  const { data: categoriesRaw = [] } = useCategories(locale);
  const categories: Category[] = categoriesRaw.map((c) => ({ id: c.id, name: c.name }));

  // Fetch search history via React Query
  const { data: searchHistory = [] } = useQuery({
    queryKey: queryKeys.searchHistories.list(),
    queryFn: async () => {
      const response = await LivestockTradingAPI.SearchHistories.All.Request({
        sorting: { key: "searchedAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [],
        pageRequest: { currentPage: 1, perPageCount: 10, listAll: false },
      });
      return response.map((h) => ({ id: h.id, searchQuery: h.searchQuery, searchedAt: h.searchedAt }));
    },
    enabled: !!user?.id,
  });

  // Save search to history
  const saveSearchHistory = useCallback(async (query: string, resultsCount: number) => {
    if (!user?.id || !query.trim()) return;
    try {
      await LivestockTradingAPI.SearchHistories.Create.Request({
        userId: user.id,
        searchQuery: query.trim(),
        filters: "",
        resultsCount,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.searchHistories.list() });
    } catch {
      // Non-critical
    }
  }, [user?.id, queryClient]);

  // Delete search history item
  const deleteHistoryItem = async (id: string) => {
    try {
      await LivestockTradingAPI.SearchHistories.Delete.Request({ id });
      queryClient.invalidateQueries({ queryKey: queryKeys.searchHistories.list() });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteHistoryError"));
    }
  };

  // Sort config
  const sortingMap: Record<SortOption, { key: string; direction: LivestockTradingAPI.Enums.XSortingDirection }> = {
    newest: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
    oldest: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
    priceAsc: { key: "basePrice", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
    priceDesc: { key: "basePrice", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
    popular: { key: "viewCount", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
  };
  const sorting = sortingMap[sortParam];

  // Fetch products via React Query
  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.products.search({
      query: queryParam,
      countryCode: selectedCountry?.code || "TR",
      categoryId: categoryParam || undefined,
      condition: conditionParam !== "all" ? CONDITION_MAP[conditionParam] : undefined,
      minPrice: minPriceParam || undefined,
      maxPrice: maxPriceParam || undefined,
      sortBy: sorting.key,
      sortDirection: sorting.direction,
      page: pageParam,
      mode: queryParam ? "search" : "all",
    }),
    queryFn: async () => {
      if (queryParam) {
        const searchResponse = await LivestockTradingAPI.Products.Search.Request({
          query: queryParam,
          countryCode: selectedCountry?.code || "TR",
          city: "",
          categoryId: categoryParam || undefined,
          minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
          maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
          condition: conditionParam !== "all" ? CONDITION_MAP[conditionParam] : undefined,
          sorting,
          pageRequest: {
            currentPage: pageParam,
            perPageCount: ITEMS_PER_PAGE,
            listAll: false,
          },
        });

        const transformed: Product[] = searchResponse.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          categoryId: item.categoryId,
          basePrice: item.basePrice,
          currency: item.currency,
          discountedPrice: item.discountedPrice,
          isInStock: item.isInStock,
          sellerId: item.sellerId,
          locationCountryCode: item.locationCountryCode,
          locationCity: item.locationCity,
          status: item.status,
          condition: item.condition,
          viewCount: item.viewCount,
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
          createdAt: item.createdAt,
          imageUrl: (item as unknown as Record<string, unknown>).coverImageUrl ? `${AppConfig.FileStorageBaseUrl}${(item as unknown as Record<string, unknown>).coverImageUrl as string}` : undefined,
        }));

        // Fetch cover images
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mediaInfo = (searchResponse as any[])
          .filter((item) => item.mediaBucketId)
          .map((item) => ({ productId: item.id, mediaBucketId: item.mediaBucketId as string, coverImageFileId: item.coverImageFileId as string }));
        if (mediaInfo.length > 0) {
          const imageMap = await getProductCoverImagesDirect(mediaInfo);
          for (const p of transformed) {
            if (!p.imageUrl && imageMap[p.id]) p.imageUrl = imageMap[p.id];
          }
        }

        // Save to search history (fire-and-forget)
        saveSearchHistory(queryParam, transformed.length);
        return transformed;
      } else {
        const filters: LivestockTradingAPI.Products.All.IXFilterItem[] = [];

        if (conditionParam && conditionParam !== "all") {
          filters.push({
            key: "condition", type: "int", isUsed: true,
            values: [CONDITION_MAP[conditionParam].toString()], min: {}, max: {}, conditionType: "equals",
          });
        }

        if (minPriceParam || maxPriceParam) {
          filters.push({
            key: "basePrice", type: "decimal", isUsed: true, values: [],
            min: minPriceParam ? { value: parseFloat(minPriceParam) } : {},
            max: maxPriceParam ? { value: parseFloat(maxPriceParam) } : {},
            conditionType: "between",
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await LivestockTradingAPI.Products.All.Request({
          countryCode: selectedCountry?.code || "TR",
          targetCurrencyCode: "",
          categoryId: categoryParam || undefined,
          sorting,
          filters,
          pageRequest: {
            currentPage: pageParam,
            perPageCount: ITEMS_PER_PAGE,
            listAll: false,
          },
        } as any);

        const products = response.map((item): Product => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          categoryId: item.categoryId,
          basePrice: item.basePrice as number,
          currency: item.currency,
          discountedPrice: item.discountedPrice as number | undefined,
          stockQuantity: item.stockQuantity,
          isInStock: item.isInStock,
          sellerId: item.sellerId,
          locationCountryCode: item.locationCountryCode,
          locationCity: item.locationCity,
          status: item.status,
          condition: item.condition,
          viewCount: item.viewCount,
          averageRating: item.averageRating as number | undefined,
          reviewCount: item.reviewCount,
          createdAt: item.createdAt,
          imageUrl: (item as unknown as Record<string, unknown>).coverImageUrl ? `${AppConfig.FileStorageBaseUrl}${(item as unknown as Record<string, unknown>).coverImageUrl as string}` : undefined,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mediaInfo2 = (response as any[])
          .filter((item) => item.mediaBucketId)
          .map((item) => ({ productId: item.id, mediaBucketId: item.mediaBucketId as string, coverImageFileId: item.coverImageFileId as string }));
        if (mediaInfo2.length > 0) {
          const imgMap = await getProductCoverImagesDirect(mediaInfo2);
          for (const p of products) {
            if (!p.imageUrl && imgMap[p.id]) p.imageUrl = imgMap[p.id];
          }
        }
        return products;
      }
    },
  });

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHistory(false);
    updateParams({ q: searchInput });
  };

  // Handle history item click
  const handleHistoryClick = (query: string) => {
    setSearchInput(query);
    setShowHistory(false);
    updateParams({ q: query });
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
    setLocalCategory("all");
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

  const filterProps: SearchFilterContentProps = {
    categories,
    localCategory,
    setLocalCategory,
    localCondition,
    setLocalCondition,
    localMinPrice,
    setLocalMinPrice,
    localMaxPrice,
    setLocalMaxPrice,
    applyFilters,
    clearFilters,
    t,
    tp,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
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
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                placeholder={t("placeholder")}
                className="pl-10"
              />

              {/* Search history dropdown */}
              {showHistory && searchHistory.length > 0 && !queryParam && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {t("recentSearches")}
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {searchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer group"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-2 flex-1 text-left text-sm"
                          onMouseDown={(e) => { e.preventDefault(); handleHistoryClick(item.searchQuery); }}
                        >
                          <Search className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.searchQuery}
                        </button>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                          onMouseDown={(e) => { e.preventDefault(); deleteHistoryItem(item.id); }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <SearchFilterContent {...filterProps} />
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
                      <SearchFilterContent {...filterProps} />
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
                    <SelectItem value="newest">{tp("sortOptions.newest")}</SelectItem>
                    <SelectItem value="oldest">{tp("sortOptions.oldest")}</SelectItem>
                    <SelectItem value="priceAsc">{tp("sortOptions.priceAsc")}</SelectItem>
                    <SelectItem value="priceDesc">{tp("sortOptions.priceDesc")}</SelectItem>
                    <SelectItem value="popular">{tp("sortOptions.popular")}</SelectItem>
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
