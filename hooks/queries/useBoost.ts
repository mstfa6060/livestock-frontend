import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export const boostKeys = {
  packages: (params?: Record<string, unknown>) => ["boostPackages", params] as const,
  productBoosts: (sellerId: string) => ["productBoosts", sellerId] as const,
};

// Hook: Get all boost packages
export function useBoostPackages(languageCode?: string) {
  return useQuery({
    queryKey: boostKeys.packages({ languageCode }),
    queryFn: async () => {
      const response = await LivestockTradingAPI.BoostPackages.All.Request({
        languageCode: languageCode || "en",
        sorting: { key: "sortOrder", direction: 0 },
        filters: [],
        pageRequest: { currentPage: 1, perPageCount: 100, listAll: true },
      });
      return response;
    },
  });
}

// Hook: Get seller's product boosts
export function useProductBoosts(sellerId: string, page = 1) {
  return useQuery({
    queryKey: [...boostKeys.productBoosts(sellerId), page],
    queryFn: async () => {
      const response = await LivestockTradingAPI.ProductBoosts.All.Request({
        sellerId,
        sorting: { key: "createdAt", direction: 1 },
        filters: [],
        pageRequest: { currentPage: page, perPageCount: 20, listAll: false },
      });
      return response;
    },
    enabled: !!sellerId,
  });
}

// Hook: Create product boost
export function useCreateProductBoost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      productId: string;
      sellerId: string;
      boostPackageId: string;
      platform: number;
      receipt: string;
      storeTransactionId: string;
    }) => {
      return await LivestockTradingAPI.ProductBoosts.Create.Request(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boostKeys.productBoosts(variables.sellerId) });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
