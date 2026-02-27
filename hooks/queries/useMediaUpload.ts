import { useMutation } from "@tanstack/react-query";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { api, AppConfig } from "@/config/livestock-config";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export function useDeleteFileMutation(options?: {
  onSuccess?: () => void;
  onError?: () => void;
}) {
  return useMutation({
    mutationFn: ({ bucketId, fileId }: { bucketId: string; fileId: string }) =>
      FileProviderAPI.Files.Delete.Request({
        bucketId,
        fileId,
        changeId: EMPTY_GUID,
      }),
    onSuccess: () => options?.onSuccess?.(),
    onError: () => options?.onError?.(),
  });
}

export function useReorderFilesMutation(options?: {
  onSuccess?: () => void;
  onError?: () => void;
}) {
  return useMutation({
    mutationFn: ({
      bucketId,
      fileOrders,
    }: {
      bucketId: string;
      fileOrders: { fileId: string; index: number }[];
    }) =>
      api.post(`${AppConfig.FileProviderUrl}/Files/Reorder`, {
        bucketId,
        fileOrders,
      }),
    onSuccess: () => options?.onSuccess?.(),
    onError: () => options?.onError?.(),
  });
}

export function useSetCoverMutation(options?: {
  onSuccess?: () => void;
  onError?: () => void;
}) {
  return useMutation({
    mutationFn: ({
      bucketId,
      fileId,
    }: {
      bucketId: string;
      fileId: string;
    }) =>
      api.post(`${AppConfig.FileProviderUrl}/Files/SetCover`, {
        bucketId,
        fileId,
      }),
    onSuccess: () => options?.onSuccess?.(),
    onError: () => options?.onError?.(),
  });
}
