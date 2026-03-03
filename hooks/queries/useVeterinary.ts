import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

// ── Health Records ──

export function useHealthRecords(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.healthRecords.list(params),
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      LivestockTradingAPI.HealthRecords.All.Request({
        sorting: {
          key: "recordDate",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 50,
          listAll: false,
        },
      }),
  });
}

export function useCreateHealthRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LivestockTradingAPI.HealthRecords.Create.IRequestModel) =>
      LivestockTradingAPI.HealthRecords.Create.Request(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthRecords.all });
    },
  });
}

export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LivestockTradingAPI.HealthRecords.Update.IRequestModel) =>
      LivestockTradingAPI.HealthRecords.Update.Request(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthRecords.all });
    },
  });
}

export function useDeleteHealthRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      LivestockTradingAPI.HealthRecords.Delete.Request({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthRecords.all });
    },
  });
}

// ── Vaccinations ──

export function useVaccinations(params?: {
  currentPage?: number;
  perPageCount?: number;
}) {
  return useQuery({
    queryKey: queryKeys.vaccinations.list(params),
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      LivestockTradingAPI.Vaccinations.All.Request({
        sorting: {
          key: "vaccinationDate",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [],
        pageRequest: {
          currentPage: params?.currentPage ?? 1,
          perPageCount: params?.perPageCount ?? 50,
          listAll: false,
        },
      }),
  });
}

export function useCreateVaccination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LivestockTradingAPI.Vaccinations.Create.IRequestModel) =>
      LivestockTradingAPI.Vaccinations.Create.Request(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vaccinations.all });
    },
  });
}

export function useUpdateVaccination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LivestockTradingAPI.Vaccinations.Update.IRequestModel) =>
      LivestockTradingAPI.Vaccinations.Update.Request(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vaccinations.all });
    },
  });
}

export function useDeleteVaccination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      LivestockTradingAPI.Vaccinations.Delete.Request({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vaccinations.all });
    },
  });
}

// ── Animal Info Pick (shared helper) ──

export function useAnimalInfoPick(keyword: string) {
  return useQuery({
    queryKey: ["animalInfoPick", keyword],
    queryFn: () =>
      LivestockTradingAPI.AnimalInfos.Pick.Request({
        selectedIds: [],
        keyword,
        limit: 20,
      }),
    staleTime: 30_000,
  });
}
