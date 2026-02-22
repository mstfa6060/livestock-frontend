"use client";

import { useState, useEffect, useCallback, useDeferredValue, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { AppConfig } from "@/config/livestock-config";
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

interface FilterContentProps {
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
  tf: (key: string) => string;
  t: (key: string) => string;
}

function FilterContent({
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
  tf,
  t,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label>{tf("category")}</Label>
        <Select value={localCategory} onValueChange={setLocalCategory}>
          <SelectTrigger>
            <SelectValue placeholder={tf("allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tf("allCategories")}</SelectItem>
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
        <Label>{tf("condition")}</Label>
        <Select value={localCondition} onValueChange={(v) => setLocalCondition(v as ConditionOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tf("allConditions")}</SelectItem>
            <SelectItem value="new">{t("condition.new")}</SelectItem>
            <SelectItem value="likeNew">{t("condition.likeNew")}</SelectItem>
            <SelectItem value="good">{t("condition.good")}</SelectItem>
            <SelectItem value="fair">{t("condition.fair")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>{tf("priceRange")}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={tf("min")}
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            min="0"
          />
          <Input
            type="number"
            placeholder={tf("max")}
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
          {tf("apply")}
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          {tf("clear")}
        </Button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const t = useTranslations("products");
  const tf = useTranslations("search.filters");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCountry = useSelectedCountry();

  // URL params
  const categoryParam = searchParams.get("category") || "";
  const conditionParam = (searchParams.get("condition") || "all") as ConditionOption;
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortParam = (searchParams.get("sort") || "newest") as SortOption;
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Local filter state (until applied)
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await LivestockTradingAPI.Categories.All.Request({
          languageCode: locale,
          sorting: { key: "name", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
          filters: [],
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
        });
        setCategories(response.map((c) => ({ id: c.id, name: c.name })));
      } catch {
        // Categories are optional
      }
    };
    fetchCategories();
  }, [locale]);

  // Sort mapping
  const getSorting = (sort: SortOption): { key: string; direction: LivestockTradingAPI.Enums.XSortingDirection } => {
    const map: Record<SortOption, { key: string; direction: LivestockTradingAPI.Enums.XSortingDirection }> = {
      newest: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
      oldest: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
      priceAsc: { key: "basePrice", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
      priceDesc: { key: "basePrice", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
      popular: { key: "viewCount", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
    };
    return map[sort];
  };

  // Transform search result to Product
  const transformResult = (item: LivestockTradingAPI.Products.Search.IResponseModel): Product => ({
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
    locationCity: item.locationCity,
    locationCountryCode: item.locationCountryCode,
    status: item.status,
    condition: item.condition,
    viewCount: item.viewCount,
    averageRating: item.averageRating,
    reviewCount: item.reviewCount,
    createdAt: item.createdAt,
    imageUrl: item.coverImageUrl ? `${AppConfig.FileStorageBaseUrl}${item.coverImageUrl}` : undefined,
  });

  // Fetch products using Search endpoint (has totalCount & coverImageUrl)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await LivestockTradingAPI.Products.Search.Request({
          query: "",
          countryCode: selectedCountry?.code || "TR",
          city: "",
          categoryId: categoryParam || undefined,
          condition: conditionParam !== "all" ? CONDITION_MAP[conditionParam] : undefined,
          minPrice: minPriceParam ? parseFloat(minPriceParam) as any : undefined,
          maxPrice: maxPriceParam ? parseFloat(maxPriceParam) as any : undefined,
          currency: selectedCountry?.defaultCurrencyCode || "TRY",
          sortBy: getSorting(sortParam).key,
          sorting: getSorting(sortParam),
          pageRequest: {
            currentPage: pageParam,
            perPageCount: ITEMS_PER_PAGE,
            listAll: false,
          },
        });

        setProducts(response.map(transformResult));
        setTotalProducts(response.length);
        setTotalPages(Math.ceil(response.length / ITEMS_PER_PAGE));
      } catch {
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [sortParam, pageParam, categoryParam, conditionParam, minPriceParam, maxPriceParam, selectedCountry?.code]);

  // Load more handler for "Load More" button
  const handleLoadMore = async () => {
    if (isLoadingMore || pageParam >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const nextPage = pageParam + 1;
      const response = await LivestockTradingAPI.Products.Search.Request({
        query: "",
        countryCode: selectedCountry?.code || "TR",
        city: "",
        categoryId: categoryParam || undefined,
        condition: conditionParam !== "all" ? CONDITION_MAP[conditionParam] : undefined,
        minPrice: minPriceParam ? parseFloat(minPriceParam) as any : undefined,
        maxPrice: maxPriceParam ? parseFloat(maxPriceParam) as any : undefined,
        currency: selectedCountry?.defaultCurrencyCode || "TRY",
        sortBy: getSorting(sortParam).key,
        sorting: getSorting(sortParam),
        pageRequest: {
          currentPage: nextPage,
          perPageCount: ITEMS_PER_PAGE,
          listAll: false,
        },
      });

      setProducts((prev) => [...prev, ...response.map(transformResult)]);
      updateParams({ page: String(nextPage) });
    } catch {
      toast.error(t("fetchError"));
    } finally {
      setIsLoadingMore(false);
    }
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

  // Debounced search with useDeferredValue
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Client-side search within loaded results
  const filteredProducts = useMemo(
    () =>
      deferredSearchQuery
        ? products.filter(
            (p) =>
              p.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
              p.shortDescription.toLowerCase().includes(deferredSearchQuery.toLowerCase())
          )
        : products,
    [products, deferredSearchQuery]
  );

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
                from: (pageParam - 1) * ITEMS_PER_PAGE + 1,
                to: Math.min(pageParam * ITEMS_PER_PAGE, totalProducts),
                total: totalProducts,
              })}
            </p>
          )}
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortParam} onValueChange={(v) => updateParams({ sort: v })}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("sortOptions.newest")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sortOptions.newest")}</SelectItem>
              <SelectItem value="oldest">{t("sortOptions.oldest")}</SelectItem>
              <SelectItem value="priceAsc">{t("sortOptions.priceAsc")}</SelectItem>
              <SelectItem value="priceDesc">{t("sortOptions.priceDesc")}</SelectItem>
              <SelectItem value="popular">{t("sortOptions.popular")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filter button */}
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {t("filters")}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{tf("title")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent
                  categories={categories}
                  localCategory={localCategory}
                  setLocalCategory={setLocalCategory}
                  localCondition={localCondition}
                  setLocalCondition={setLocalCondition}
                  localMinPrice={localMinPrice}
                  setLocalMinPrice={setLocalMinPrice}
                  localMaxPrice={localMaxPrice}
                  setLocalMaxPrice={setLocalMaxPrice}
                  applyFilters={applyFilters}
                  clearFilters={clearFilters}
                  tf={tf}
                  t={t}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active filters badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {categoryParam && (
              <Badge variant="secondary" className="gap-1">
                {tf("category")}: {getCategoryName(categoryParam)}
                <button onClick={() => updateParams({ category: null })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {conditionParam !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {tf("condition")}: {t(`condition.${conditionParam}`)}
                <button onClick={() => updateParams({ condition: null })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(minPriceParam || maxPriceParam) && (
              <Badge variant="secondary" className="gap-1">
                {tf("price")}: {minPriceParam || "0"} - {maxPriceParam || "∞"}
                <button onClick={() => updateParams({ minPrice: null, maxPrice: null })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {tf("clearAll")}
            </Button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {tf("title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent
                  categories={categories}
                  localCategory={localCategory}
                  setLocalCategory={setLocalCategory}
                  localCondition={localCondition}
                  setLocalCondition={setLocalCondition}
                  localMinPrice={localMinPrice}
                  setLocalMinPrice={setLocalMinPrice}
                  localMaxPrice={localMaxPrice}
                  setLocalMaxPrice={setLocalMaxPrice}
                  applyFilters={applyFilters}
                  clearFilters={clearFilters}
                  tf={tf}
                  t={t}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">{t("noResults")}</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    {tf("clearAll")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Load More */}
            {pageParam < totalPages && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("loadMore")
                  )}
                </Button>
              </div>
            )}

            {/* Results count */}
            {!isLoading && totalProducts > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t("showingOf", { count: products.length, total: totalProducts })}
              </p>
            )}
          </div>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
