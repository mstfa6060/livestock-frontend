import { create } from 'zustand';
import { LivestockTradingAPI } from '@/api/business_modules/livestocktrading';

interface FavoriteState {
  // Map of productId -> favoriteRecordId for quick lookup and delete
  favoriteMap: Map<string, string>;

  // Loading state
  isLoading: boolean;

  // Initialization state
  isInitialized: boolean;

  // Actions
  initialize: (userId: string, force?: boolean) => Promise<void>;
  toggleFavorite: (productId: string, userId: string) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoriteState>((set, get) => ({
  favoriteMap: new Map<string, string>(),
  isLoading: false,
  isInitialized: false,

  initialize: async (userId: string, force = false) => {
    const { isInitialized, isLoading } = get();

    // Skip if already initialized (unless forced) or currently loading
    if ((isInitialized && !force) || isLoading) {
      return;
    }

    try {
      set({ isLoading: true });

      // Fetch all user favorites
      const favorites = await LivestockTradingAPI.FavoriteProducts.All.Request({
        sorting: { key: 'addedAt', direction: 1 },
        filters: [],
        pageRequest: {
          currentPage: 1,
          perPageCount: 1000,
          listAll: true,
        },
      });

      // Build productId -> favoriteRecordId map
      const favoriteMap = new Map<string, string>();
      for (const f of favorites) {
        favoriteMap.set(f.productId, f.id);
      }
      set({ favoriteMap, isLoading: false, isInitialized: true });
    } catch {
      // Mark as initialized even on error to prevent retry loops
      set({ isLoading: false, isInitialized: true });
    }
  },

  toggleFavorite: async (productId: string, userId: string) => {
    const { favoriteMap, isInitialized } = get();

    // Lazy initialization
    if (!isInitialized) {
      await get().initialize(userId);
    }

    const existingRecordId = get().favoriteMap.get(productId);
    const isFavorited = !!existingRecordId;

    // Optimistic update
    const previousMap = new Map(get().favoriteMap);
    const newMap = new Map(get().favoriteMap);
    if (isFavorited) {
      newMap.delete(productId);
    } else {
      newMap.set(productId, 'pending');
    }
    set({ favoriteMap: newMap });

    try {
      if (isFavorited) {
        // Remove: use cached record ID directly (no extra API call)
        await LivestockTradingAPI.FavoriteProducts.Delete.Request({ id: existingRecordId });
      } else {
        // Add to favorites
        const response = await LivestockTradingAPI.FavoriteProducts.Create.Request({
          userId,
          productId,
        });
        // Update map with the real record ID
        const updatedMap = new Map(get().favoriteMap);
        updatedMap.set(productId, response.id);
        set({ favoriteMap: updatedMap });
      }

      return !isFavorited;
    } catch {
      // Revert optimistic update on error
      set({ favoriteMap: previousMap });
      return isFavorited;
    }
  },

  isFavorite: (productId: string) => {
    return get().favoriteMap.has(productId);
  },

  clearFavorites: () => {
    set({ favoriteMap: new Map<string, string>(), isInitialized: false });
  },
}));
