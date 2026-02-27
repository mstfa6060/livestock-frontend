import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useLocationList(params?: {
  sellerId?: string;
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.locations.list(params),
    queryFn: () => {
      const filters: LivestockTradingAPI.Locations.All.IXFilterItem[] = [];
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
      return LivestockTradingAPI.Locations.All.Request({
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
