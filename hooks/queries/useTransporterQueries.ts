import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useTransportRequests(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.transporters.requests(params),
    queryFn: () =>
      LivestockTradingAPI.TransportRequests.All.Request({
        sorting: {
          key: "createdAt",
          direction:
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 20,
          listAll: false,
        },
      }),
  });
}

export function useTransportOffers(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.transporters.transportOffers(params),
    queryFn: () =>
      LivestockTradingAPI.TransportOffers.All.Request({
        sorting: {
          key: "createdAt",
          direction:
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 20,
          listAll: false,
        },
      }),
  });
}
