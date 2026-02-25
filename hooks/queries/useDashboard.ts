import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function useDashboardMyStats(
  userId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.dashboard.myStats(),
    queryFn: () =>
      LivestockTradingAPI.Dashboard.MyStats.Request({
        userId,
        period: "all",
      }),
    enabled: (options?.enabled ?? true) && !!userId,
  });
}

export function useDashboardStats(
  userId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () =>
      LivestockTradingAPI.Dashboard.Stats.Request({ userId }),
    enabled: (options?.enabled ?? true) && !!userId,
  });
}
