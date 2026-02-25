import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useOffersSent(
  userId: string,
  params?: {
    currentPage?: number;
    perPageCount?: number;
  }
) {
  return useQuery({
    queryKey: queryKeys.offers.sent(params),
    queryFn: () =>
      LivestockTradingAPI.Offers.All.Request({
        sorting: {
          key: "createdAt",
          direction:
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [
          {
            key: "buyerUserId",
            type: "guid",
            isUsed: true,
            values: [userId],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 50,
          listAll: false,
        },
      }),
    enabled: !!userId,
  });
}

export function useOffersReceived(
  userId: string,
  params?: {
    currentPage?: number;
    perPageCount?: number;
  }
) {
  return useQuery({
    queryKey: queryKeys.offers.received(params),
    queryFn: () =>
      LivestockTradingAPI.Offers.All.Request({
        sorting: {
          key: "createdAt",
          direction:
            LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [
          {
            key: "sellerUserId",
            type: "guid",
            isUsed: true,
            values: [userId],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 50,
          listAll: false,
        },
      }),
    enabled: !!userId,
  });
}
