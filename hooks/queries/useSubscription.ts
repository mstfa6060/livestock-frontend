import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

// Query keys
export const subscriptionKeys = {
  plans: (params?: Record<string, unknown>) =>
    ["subscriptionPlans", params] as const,
  planDetail: (id: string) =>
    ["subscriptionPlans", "detail", id] as const,
  sellerSubscription: (sellerId: string) =>
    ["sellerSubscription", sellerId] as const,
  boostPackages: (params?: Record<string, unknown>) =>
    ["boostPackages", params] as const,
  productBoosts: (sellerId: string) =>
    ["productBoosts", sellerId] as const,
};

// Hook: Get all subscription plans
export function useSubscriptionPlans(
  languageCode?: string,
  targetType?: number
) {
  return useQuery({
    queryKey: subscriptionKeys.plans({ languageCode, targetType }),
    queryFn: async () => {
      const response =
        await LivestockTradingAPI.SubscriptionPlans.All.Request({
          languageCode: languageCode || "en",
          targetType,
          sorting: {
            key: "sortOrder",
            direction:
              LivestockTradingAPI.Enums.XSortingDirection.Ascending,
          },
          filters: [],
          pageRequest: {
            currentPage: 1,
            perPageCount: 100,
            listAll: true,
          },
        });
      return response;
    },
  });
}

// Hook: Get subscription plan detail
export function useSubscriptionPlanDetail(
  id: string,
  languageCode?: string
) {
  return useQuery({
    queryKey: subscriptionKeys.planDetail(id),
    queryFn: async () => {
      const response =
        await LivestockTradingAPI.SubscriptionPlans.Detail.Request({
          id,
          languageCode: languageCode || "en",
        });
      return response;
    },
    enabled: !!id,
  });
}

// Hook: Get seller's current subscription
export function useSellerSubscription(sellerId: string) {
  return useQuery({
    queryKey: subscriptionKeys.sellerSubscription(sellerId),
    queryFn: async () => {
      try {
        const response =
          await LivestockTradingAPI.SellerSubscriptions.Detail.Request({
            sellerId,
          });
        return response ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!sellerId,
  });
}

// Hook: Create subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sellerId: string;
      subscriptionPlanId: string;
      period: number;
      platform: number;
      receipt: string;
      storeTransactionId: string;
    }) => {
      return await LivestockTradingAPI.SellerSubscriptions.Create.Request(
        data
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.sellerSubscription(variables.sellerId),
      });
    },
  });
}

// Hook: Update subscription (cancel, toggle auto-renew)
export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      autoRenew?: boolean;
      status?: number;
      receipt: string;
    }) => {
      return await LivestockTradingAPI.SellerSubscriptions.Update.Request(
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sellerSubscription"],
      });
    },
  });
}

// Hook: Update subscription plan (admin)
export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description: string;
      nameTranslations: string;
      descriptionTranslations: string;
      targetType: number;
      tier: number;
      priceMonthly: number;
      priceYearly: number;
      currency: string;
      appleProductIdMonthly: string;
      appleProductIdYearly: string;
      googleProductIdMonthly: string;
      googleProductIdYearly: string;
      maxActiveListings: number;
      maxPhotosPerListing: number;
      monthlyBoostCredits: number;
      hasDetailedAnalytics: boolean;
      hasPrioritySupport: boolean;
      hasFeaturedBadge: boolean;
      sortOrder: number;
      isActive: boolean;
    }) => {
      return await LivestockTradingAPI.SubscriptionPlans.Update.Request(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptionPlans"],
      });
    },
  });
}

// useBoostPackages, useProductBoosts, useCreateProductBoost moved to useBoost.ts to avoid duplicate exports
