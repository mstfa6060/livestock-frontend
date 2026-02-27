import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  displayOrder: number;
}

export function useBanners() {
  return useQuery({
    queryKey: queryKeys.banners.list(),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Banners.All.Request({
        sorting: {
          key: "displayOrder",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
        },
        filters: [
          {
            key: "isActive",
            type: "boolean",
            isUsed: true,
            values: [true],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 10, listAll: false },
      });

      return response.map(
        (b): Banner => ({
          id: b.id,
          title: b.title,
          description: b.description,
          imageUrl: b.imageUrl,
          targetUrl: b.targetUrl,
          displayOrder: b.displayOrder,
        })
      );
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
