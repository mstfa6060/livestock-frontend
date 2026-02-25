import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { IAMAPI } from "@/api/base_modules/iam";

export function useCountries() {
  return useQuery({
    queryKey: queryKeys.countries.list(),
    queryFn: () => IAMAPI.Countries.All.Request({ keyword: "" }),
    staleTime: 60 * 60 * 1000, // 1 hour - very static data
  });
}

export function useUserDetail(
  userId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => IAMAPI.Users.Detail.Request({ userId }),
    enabled: (options?.enabled ?? true) && !!userId,
  });
}
