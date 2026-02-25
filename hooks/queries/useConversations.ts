import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useConversationList(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () =>
      LivestockTradingAPI.Conversations.All.Request({
        sorting: {
          key: "lastMessageAt",
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
