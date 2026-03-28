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
      // Try GetByUserId first
      try {
        const response = await LivestockTradingAPI.Sellers.GetByUserId.Request({
          userId,
        });
        if (response) return response;
      } catch {
        // GetByUserId failed, fall through to fallback
      }

      // Fallback: search in Sellers.All by userId filter
      try {
        const allSellers = await LivestockTradingAPI.Sellers.All.Request({
          sorting: {
            key: "createdAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          filters: [
            {
              key: "userId",
              type: "guid",
              isUsed: true,
              values: [userId],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 1, listAll: false },
        });
        if (Array.isArray(allSellers) && allSellers.length > 0) {
          return allSellers[0];
        }
      } catch {
        // Fallback also failed
      }

      return null;
    },
    enabled: (options?.enabled ?? true) && !!userId,
  });
}
