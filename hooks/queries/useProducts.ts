import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { AppConfig } from "@/config/livestock-config";
import { getProductCoverImagesDirect } from "@/lib/product-images";
import type { Product } from "@/components/features/product-card";

interface ProductSearchParams {
  query?: string;
  countryCode?: string;
  city?: string;
  currency?: string;
  targetCurrencyCode?: string;
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
    imageUrl: (p as unknown as Record<string, unknown>).coverImageUrl
      ? `${AppConfig.FileStorageBaseUrl}${(p as unknown as Record<string, unknown>).coverImageUrl as string}`
      : undefined,
    // Converted price fields from backend
    convertedPrice: p.convertedPrice as number | null,
    convertedDiscountedPrice: p.convertedDiscountedPrice as number | null,
    convertedCurrencyCode: p.convertedCurrencyCode || undefined,
    convertedCurrencySymbol: p.convertedCurrencySymbol || undefined,
    // Viewer price fields from backend
    viewerPrice: p.viewerPrice as number | null,
    viewerDiscountedPrice: p.viewerDiscountedPrice as number | null,
    viewerCurrencyCode: p.viewerCurrencyCode || undefined,
    viewerCurrencySymbol: p.viewerCurrencySymbol || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function attachCoverImages(products: Product[], rawResponse: any[]): Promise<Product[]> {
  const mediaInfo = rawResponse
    .filter((item) => item.mediaBucketId)
    .map((item) => ({
      productId: item.id,
      mediaBucketId: item.mediaBucketId as string,
      coverImageFileId: item.coverImageFileId as string,
    }));
  if (mediaInfo.length === 0) return products;
  const imageMap = await getProductCoverImagesDirect(mediaInfo);
  for (const p of products) {
    if (!p.imageUrl && imageMap[p.id]) p.imageUrl = imageMap[p.id];
  }
  return products;
}

export function useProductSearch(params: ProductSearchParams) {
  return useQuery({
    queryKey: queryKeys.products.search({ ...params }),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Products.Search.Request({
        query: params.query ?? "",
        countryCode: params.countryCode ?? "TR",
        city: params.city ?? "",
        viewerCurrencyCode: params.targetCurrencyCode ?? "",
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

      const products = response.map(mapProductResponse);
      return attachCoverImages(products, response as any[]);
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
  targetCurrencyCode?: string;
}

export function useProductList(
  params: ProductListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.list({ ...params }),
    queryFn: async () => {
      const filters: LivestockTradingAPI.Products.All.IXFilterItem[] = [];

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await LivestockTradingAPI.Products.All.Request({
        countryCode: params.countryCode ?? "TR",
        targetCurrencyCode: params.targetCurrencyCode ?? "",
        categoryId: params.categoryId || undefined,
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
      } as any);

      const products = response.map(mapProductResponse);
      return attachCoverImages(products, response as any[]);
    },
    enabled: options?.enabled ?? true,
  });
}

export function useProductDetail(
  productId: string,
  options?: { enabled?: boolean; viewerCurrencyCode?: string }
) {
  return useQuery({
    queryKey: [...queryKeys.products.detail(productId), options?.viewerCurrencyCode ?? ""],
    queryFn: () =>
      LivestockTradingAPI.Products.Detail.Request({
        id: productId,
        viewerCurrencyCode: options?.viewerCurrencyCode ?? "",
      }),
    enabled: (options?.enabled ?? true) && !!productId,
  });
}
