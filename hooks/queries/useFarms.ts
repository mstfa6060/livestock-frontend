import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useFarmList(params?: {
  sellerId?: string;
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.farms.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutes - farms change infrequently
    queryFn: () => {
      const filters: LivestockTradingAPI.Farms.All.IXFilterItem[] = [];
      if (params?.sellerId) {
        filters.push({
          key: "sellerId",
          type: "guid",
          isUsed: true,
          values: [params.sellerId],
          min: {},
          max: {},
          conditionType: "equals",
        });
      }
      return LivestockTradingAPI.Farms.All.Request({
        sorting: {
          key: "createdAt",
          direction:
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters,
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 20,
          listAll: false,
        },
      });
    },
  });
}
