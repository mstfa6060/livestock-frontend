import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

interface SellerListParams {
  sortBy?: string;
  sortDirection?: number;
  currentPage?: number;
  perPageCount?: number;
}

export function useSellerList(params: SellerListParams) {
  return useQuery({
    queryKey: queryKeys.sellers.list(params),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Sellers.All.Request({
        sorting: {
          key: params.sortBy ?? "createdAt",
          direction:
            params.sortDirection ??
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [],
        pageRequest: {
          currentPage: params.currentPage ?? 1,
          perPageCount: params.perPageCount ?? 12,
          listAll: false,
        },
      });

      return response;
    },
  });
}

export function useSellerDetail(
  sellerId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.sellers.detail(sellerId),
    queryFn: () =>
      LivestockTradingAPI.Sellers.Detail.Request({ id: sellerId }),
    enabled: (options?.enabled ?? true) && !!sellerId,
  });
}

export function useSellerByUserId(
  userId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.sellers.byUserId(userId),
    queryFn: async () => {
      try {
        const response = await LivestockTradingAPI.Sellers.GetByUserId.Request({
          userId,
        });
        return response ?? null;
      } catch {
        return null;
      }
    },
    enabled: (options?.enabled ?? true) && !!userId,
  });
}
