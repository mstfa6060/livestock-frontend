import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useShippingCarriers(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.shippingCarriers.list(params),
    staleTime: 30 * 60 * 1000,
    queryFn: () =>
      LivestockTradingAPI.ShippingCarriers.All.Request({
        sorting: {
          key: "name",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
        },
        filters: [],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 100,
          listAll: false,
        },
      }),
  });
}

export function useShippingZones(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.shippingZones.list(params),
    staleTime: 30 * 60 * 1000,
    queryFn: () =>
      LivestockTradingAPI.ShippingZones.All.Request({
        sorting: {
          key: "name",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
        },
        filters: [],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 100,
          listAll: false,
        },
      }),
  });
}

export function useShippingRates(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.shippingRates.list(params),
    staleTime: 30 * 60 * 1000,
    queryFn: () =>
      LivestockTradingAPI.ShippingRates.All.Request({
        sorting: {
          key: "createdAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 100,
          listAll: false,
        },
      }),
  });
}
