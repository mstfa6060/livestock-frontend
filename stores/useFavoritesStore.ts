import { create } from 'zustand';
import { LivestockTradingAPI } from '@/api/business_modules/livestocktrading';
import { toast } from 'sonner';

interface FavoriteState {
  // Favorite product IDs set for quick lookup
  favoriteIds: Set<string>;

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
  favoriteIds: new Set<string>(),
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
        sorting: { key: 'addedAt', direction: 1 }, // Descending
        filters: [],
        pageRequest: {
          currentPage: 1,
          perPageCount: 1000, // Get all favorites
          listAll: true,
        },
      });

      // Extract product IDs
      const productIds = new Set(favorites.map(f => f.productId));
      set({ favoriteIds: productIds, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize favorites:', error);
      // Mark as initialized even on error to prevent retry loops
      // User can manually retry by navigating to favorites page
      set({ isLoading: false, isInitialized: true });
    }
  },

  toggleFavorite: async (productId: string, userId: string) => {
    const { favoriteIds, isInitialized } = get();

    // Lazy initialization: initialize on first toggle if not already done
    if (!isInitialized) {
      await get().initialize(userId);
    }

    const isFavorited = favoriteIds.has(productId);

    // Optimistic update
    const newFavoriteIds = new Set(favoriteIds);
    if (isFavorited) {
      newFavoriteIds.delete(productId);
    } else {
      newFavoriteIds.add(productId);
    }
    set({ favoriteIds: newFavoriteIds });

    try {
      if (isFavorited) {
        // Remove from favorites
        // First, find the favorite ID
        const favorites = await LivestockTradingAPI.FavoriteProducts.All.Request({
          sorting: { key: 'addedAt', direction: 1 },
          filters: [],
          pageRequest: { currentPage: 1, perPageCount: 1000, listAll: true },
        });

        const favorite = favorites.find(f => f.productId === productId);
        if (favorite) {
          await LivestockTradingAPI.FavoriteProducts.Delete.Request({ id: favorite.id });
        }
      } else {
        // Add to favorites
        await LivestockTradingAPI.FavoriteProducts.Create.Request({
          userId,
          productId,
        });
      }

      return !isFavorited; // Return new state
    } catch (error) {
      console.error('Failed to toggle favorite:', error);

      // Revert optimistic update on error
      set({ favoriteIds });

      // Show error toast
      toast.error(isFavorited ? 'Favorilerden çıkarılamadı' : 'Favorilere eklenemedi');

      return isFavorited; // Return original state
    }
  },

  isFavorite: (productId: string) => {
    const { favoriteIds } = get();
    return favoriteIds.has(productId);
  },

  clearFavorites: () => {
    set({ favoriteIds: new Set<string>(), isInitialized: false });
  },
}));
