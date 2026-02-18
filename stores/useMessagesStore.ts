import { create } from "zustand";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

interface MessagesState {
  unreadCount: number;
  isLoading: boolean;
  lastFetched: number | null;
  fetchUnreadCount: (userId: string, force?: boolean) => Promise<void>;
  clearMessages: () => void;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const useMessagesStore = create<MessagesState>((set, get) => ({
  unreadCount: 0,
  isLoading: false,
  lastFetched: null,

  fetchUnreadCount: async (userId: string, force = false) => {
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      return;
    }
    if (isLoading) return;

    set({ isLoading: true });

    try {
      const response = await LivestockTradingAPI.Messages.UnreadCount.Request({
        userId,
      });

      set({
        unreadCount: response.totalUnreadCount,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch {
      set({ isLoading: false });
    }
  },

  clearMessages: () => {
    set({ unreadCount: 0, lastFetched: null });
  },
}));
