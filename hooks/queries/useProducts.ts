import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { AppConfig } from "@/config/livestock-config";
import type { Product } from "@/components/features/product-card";

interface ProductSearchParams {
  query?: string;
  countryCode?: string;
  city?: string;
  currency?: string;
  sortBy?: string;
  sortDirection?: number;
  categoryId?: string;
  condition?: number;
  minPrice?: number;
  maxPrice?: number;
  currentPage?: number;
  perPageCount?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProductResponse(p: any): Product {
  return {
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
    imageUrl: p.coverImageUrl
      ? `${AppConfig.FileStorageBaseUrl}${p.coverImageUrl}`
      : undefined,
  };
}

export function useProductSearch(params: ProductSearchParams) {
  return useQuery({
    queryKey: queryKeys.products.search({ ...params }),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Products.Search.Request({
        query: params.query ?? "",
        countryCode: params.countryCode ?? "TR",
        city: params.city ?? "",
        currency: params.currency ?? "TRY",
        sortBy: params.sortBy ?? "createdAt",
        sorting: {
          key: params.sortBy ?? "createdAt",
          direction:
            params.sortDirection ??
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        pageRequest: {
          currentPage: params.currentPage ?? 1,
          perPageCount: params.perPageCount ?? 8,
          listAll: false,
        },
      });

      return response.map(mapProductResponse);
    },
  });
}

interface ProductListParams {
  sortBy?: string;
  sortDirection?: number;
  categoryId?: string;
  condition?: number;
  minPrice?: number;
  maxPrice?: number;
  currentPage?: number;
  perPageCount?: number;
  slug?: string;
  countryCode?: string;
}

export function useProductList(
  params: ProductListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.list({ ...params }),
    queryFn: async () => {
      const filters: LivestockTradingAPI.Products.All.IXFilterItem[] = [];

      if (params.categoryId) {
        filters.push({
          key: "categoryId",
          type: "guid",
          isUsed: true,
          values: [params.categoryId],
          min: {},
          max: {},
          conditionType: "equals",
        });
      }

      if (params.condition !== undefined) {
        filters.push({
          key: "condition",
          type: "number",
          isUsed: true,
          values: [params.condition],
          min: {},
          max: {},
          conditionType: "equals",
        });
      }

      if (params.slug) {
        filters.push({
          key: "slug",
          type: "string",
          isUsed: true,
          values: [params.slug],
          min: {},
          max: {},
          conditionType: "equals",
        });
      }

      const response = await LivestockTradingAPI.Products.All.Request({
        countryCode: params.countryCode ?? "TR",
        sorting: {
          key: params.sortBy ?? "createdAt",
          direction:
            params.sortDirection ??
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters,
        pageRequest: {
          currentPage: params.currentPage ?? 1,
          perPageCount: params.perPageCount ?? 12,
          listAll: false,
        },
      });

      return response.map(mapProductResponse);
    },
    enabled: options?.enabled ?? true,
  });
}

export function useProductDetail(
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () =>
      LivestockTradingAPI.Products.Detail.Request({ id: productId }),
    enabled: (options?.enabled ?? true) && !!productId,
  });
}
