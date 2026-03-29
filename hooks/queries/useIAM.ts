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

export function useProvinces(countryId: number) {
  return useQuery({
    queryKey: queryKeys.provinces.byCountry(countryId),
    queryFn: () => IAMAPI.Provinces.All.Request({ countryId, keyword: "" }),
    staleTime: 24 * 60 * 60 * 1000, // 24h - location data rarely changes
    enabled: countryId > 0,
  });
}

export function useDistricts(provinceId: number) {
  return useQuery({
    queryKey: queryKeys.districts.byProvince(provinceId),
    queryFn: () =>
      IAMAPI.Districts.ByProvince.Request({ provinceId, keyword: "" }),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: provinceId > 0,
  });
}

export function useNeighborhoods(districtId: number) {
  return useQuery({
    queryKey: queryKeys.neighborhoods.byDistrict(districtId),
    queryFn: () =>
      IAMAPI.Neighborhoods.ByDistrict.Request({ districtId, keyword: "" }),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: districtId > 0,
  });
}

export function useDetectCountry() {
  return useQuery({
    queryKey: queryKeys.geoIp.detect(),
    queryFn: () => IAMAPI.GeoIp.DetectCountry.Request({}),
    staleTime: Infinity, // IP won't change in a session
    retry: 1,
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
