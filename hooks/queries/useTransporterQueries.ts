import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useTransporterByUserId(
  userId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.transporters.byUserId(userId),
    queryFn: async () => {
      try {
        const response = await LivestockTradingAPI.Transporters.All.Request({
          sorting: {
            key: "createdAt",
            direction:
              LivestockTradingAPI.Enums.XSortingDirection.Descending,
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
          pageRequest: {
            currentPage: 1,
            perPageCount: 1,
            listAll: false,
          },
        });
        // response is array, return first item or null
        const items = response as unknown as Array<{ id: string }>;
        return items && items.length > 0 ? items[0] : null;
      } catch {
        return null;
      }
    },
    enabled: (options?.enabled ?? true) && !!userId,
  });
}

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
