import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useCategories(locale: string) {
  return useQuery({
    queryKey: queryKeys.categories.list(locale),
    queryFn: () =>
      LivestockTradingAPI.Categories.All.Request({
        languageCode: locale,
        sorting: {
          key: "sortOrder",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
        },
        filters: [],
        pageRequest: { currentPage: 1, perPageCount: 500, listAll: false },
      }),
    staleTime: 30 * 60 * 1000, // 30 minutes - semi-static data
  });
}
