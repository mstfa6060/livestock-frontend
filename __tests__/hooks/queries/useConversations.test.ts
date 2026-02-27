import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "../../test-utils";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockConversationsAllRequest = vi.fn();

vi.mock("@/api/business_modules/livestocktrading", () => ({
  LivestockTradingAPI: {
    Conversations: {
      All: { Request: (...args: unknown[]) => mockConversationsAllRequest(...args) },
    },
    Enums: {
      XSortingDirection: { Ascending: 0, Descending: 1 },
    },
  },
}));

import { useConversationList } from "@/hooks/queries/useConversations";

// ─── Test Data ──────────────────────────────────────────────────────

const mockConversations = [
  {
    id: "conv-1",
    buyerUserId: "user-1",
    sellerUserId: "user-2",
    productId: "prod-1",
    lastMessage: "Is this still available?",
    lastMessageAt: "2026-02-27T10:00:00Z",
    unreadCount: 2,
  },
  {
    id: "conv-2",
    buyerUserId: "user-1",
    sellerUserId: "user-3",
    productId: "prod-2",
    lastMessage: "Price negotiable?",
    lastMessageAt: "2026-02-26T15:00:00Z",
    unreadCount: 0,
  },
];

// ─── Tests ──────────────────────────────────────────────────────────

describe("useConversations hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useConversationList", () => {
    it("should fetch conversations list", async () => {
      mockConversationsAllRequest.mockResolvedValueOnce(mockConversations);

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(() => useConversationList(), {
        wrapper: Wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConversations);
      expect(result.current.data).toHaveLength(2);
    });

    it("should pass default pagination params", async () => {
      mockConversationsAllRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      renderHook(() => useConversationList(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockConversationsAllRequest).toHaveBeenCalled();
      });

      expect(mockConversationsAllRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          sorting: expect.objectContaining({
            key: "lastMessageAt",
            direction: 1, // Descending
          }),
          pageRequest: expect.objectContaining({
            currentPage: 1,
            perPageCount: 20,
            listAll: false,
          }),
        })
      );
    });

    it("should pass custom pagination params", async () => {
      mockConversationsAllRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      renderHook(
        () => useConversationList({ currentPage: 3, perPageCount: 10 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockConversationsAllRequest).toHaveBeenCalled();
      });

      expect(mockConversationsAllRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          pageRequest: expect.objectContaining({
            currentPage: 3,
            perPageCount: 10,
          }),
        })
      );
    });

    it("should handle error state", async () => {
      mockConversationsAllRequest.mockRejectedValueOnce(
        new Error("Unauthorized")
      );

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(() => useConversationList(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should return empty array when no conversations exist", async () => {
      mockConversationsAllRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(() => useConversationList(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });
});
