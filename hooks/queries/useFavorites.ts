import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

/** Map of productId → favoriteRecordId */
export type FavoriteMap = Map<string, string>;

/**
 * Fetch all favorites for a user as a Map<productId, recordId>.
 * Replaces useFavoritesStore.initialize().
 */
export function useFavorites(userId: string) {
  return useQuery({
    queryKey: queryKeys.favorites.list(userId),
    queryFn: async (): Promise<FavoriteMap> => {
      const favorites =
        await LivestockTradingAPI.FavoriteProducts.All.Request({
          sorting: { key: "addedAt", direction: 1 },
          filters: [],
          pageRequest: {
            currentPage: 1,
            perPageCount: 500,
            listAll: false,
          },
        });

      const map = new Map<string, string>();
      for (const f of favorites) {
        map.set(f.productId, f.id);
      }
      return map;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

interface ToggleFavoriteVars {
  productId: string;
  /** The existing favorite record ID (needed for delete). Undefined = add. */
  existingRecordId?: string;
}

/**
 * Toggle a favorite with optimistic update.
 * Returns true if added, false if removed.
 */
export function useToggleFavoriteMutation(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.favorites.list(userId);

  return useMutation({
    mutationFn: async ({
      productId,
      existingRecordId,
    }: ToggleFavoriteVars): Promise<boolean> => {
      if (existingRecordId) {
        // Remove
        await LivestockTradingAPI.FavoriteProducts.Delete.Request({
          id: existingRecordId,
        });
        return false;
      } else {
        // Add
        const response =
          await LivestockTradingAPI.FavoriteProducts.Create.Request({
            userId,
            productId,
          });
        // Update map with real record ID
        queryClient.setQueryData<FavoriteMap>(queryKey, (old) => {
          if (!old) return old;
          const updated = new Map(old);
          updated.set(productId, response.id);
          return updated;
        });
        return true;
      }
    },
    onMutate: async ({ productId, existingRecordId }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<FavoriteMap>(queryKey);

      // Optimistic update
      const newMap = new Map(previous);
      if (existingRecordId) {
        newMap.delete(productId);
      } else {
        newMap.set(productId, "pending");
      }
      queryClient.setQueryData(queryKey, newMap);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}

/**
 * Convenience hook combining query + mutation for use in components.
 */
export function useFavoriteActions(userId: string) {
  const { data: favoriteMap } = useFavorites(userId);
  const mutation = useToggleFavoriteMutation(userId);

  const isFavorite = (productId: string) =>
    favoriteMap?.has(productId) ?? false;

  const toggleFavorite = async (productId: string): Promise<boolean> => {
    const existingRecordId = favoriteMap?.get(productId);
    return mutation.mutateAsync({
      productId,
      existingRecordId:
        existingRecordId && existingRecordId !== "pending"
          ? existingRecordId
          : undefined,
    });
  };

  return { isFavorite, toggleFavorite, favoriteMap };
}
