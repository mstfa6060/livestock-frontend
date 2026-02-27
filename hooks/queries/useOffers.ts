import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface MakeOfferParams {
  productId: string;
  buyerUserId: string;
  sellerUserId: string;
  offeredPrice: number;
  currency: string;
  quantity: number;
  message: string;
}

export function useMakeOfferMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MakeOfferParams) =>
      LivestockTradingAPI.Offers.Create.Request({
        ...params,
        status: 0, // Pending
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
