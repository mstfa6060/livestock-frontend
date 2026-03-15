import { useQuery } from "@tanstack/react-query";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export const currencyKeys = {
  all: ["currencies"] as const,
  lists: () => [...currencyKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...currencyKeys.lists(), params] as const,
};

export interface CurrencyItem {
  id: string;
  code: string;
  symbol: string;
  name: string;
  exchangeRateToUSD: number;
  lastUpdated: string;
  isActive: boolean;
  createdAt: string;
}

export function useCurrencies() {
  return useQuery({
    queryKey: currencyKeys.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const response = await LivestockTradingAPI.Currencies.All.Request({
        sorting: {
          key: "code",
          direction:
            LivestockTradingAPI.Enums.XSortingDirection.Ascending,
        },
        filters: [],
        pageRequest: {
          currentPage: 1,
          perPageCount: 300,
          listAll: true,
        },
      });
      return response as unknown as CurrencyItem[];
    },
  });
}
