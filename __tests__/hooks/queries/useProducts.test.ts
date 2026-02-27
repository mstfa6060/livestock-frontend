import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "../../test-utils";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockSearchRequest = vi.fn();
const mockAllRequest = vi.fn();
const mockDetailRequest = vi.fn();

vi.mock("@/api/business_modules/livestocktrading", () => ({
  LivestockTradingAPI: {
    Products: {
      Search: { Request: (...args: unknown[]) => mockSearchRequest(...args) },
      All: {
        Request: (...args: unknown[]) => mockAllRequest(...args),
        IXFilterItem: {},
      },
      Detail: { Request: (...args: unknown[]) => mockDetailRequest(...args) },
    },
    Enums: {
      XSortingDirection: { Ascending: 0, Descending: 1 },
    },
  },
}));

vi.mock("@/config/livestock-config", () => ({
  AppConfig: {
    FileStorageBaseUrl: "https://api.livestock-trading.com/file-storage/",
  },
}));

import {
  useProductSearch,
  useProductList,
  useProductDetail,
} from "@/hooks/queries/useProducts";

// ─── Test Data ──────────────────────────────────────────────────────

const mockProductApiResponse = [
  {
    id: "prod-1",
    title: "Angus Bull",
    slug: "angus-bull",
    shortDescription: "Premium Angus bull",
    categoryId: "cat-1",
    basePrice: 15000,
    currency: "TRY",
    discountedPrice: null,
    stockQuantity: 5,
    isInStock: true,
    sellerId: "seller-1",
    locationCity: "Ankara",
    locationCountryCode: "TR",
    status: 1,
    condition: 0,
    viewCount: 120,
    averageRating: 4.5,
    reviewCount: 10,
    createdAt: "2026-02-27T10:00:00Z",
    coverImageUrl: "products/angus-bull.jpg",
  },
  {
    id: "prod-2",
    title: "Holstein Cow",
    slug: "holstein-cow",
    shortDescription: "Dairy Holstein cow",
    categoryId: "cat-2",
    basePrice: 25000,
    currency: "TRY",
    discountedPrice: 22000,
    stockQuantity: 3,
    isInStock: true,
    sellerId: "seller-2",
    locationCity: "Istanbul",
    locationCountryCode: "TR",
    status: 1,
    condition: 0,
    viewCount: 80,
    averageRating: null,
    reviewCount: 0,
    createdAt: "2026-02-26T15:00:00Z",
    coverImageUrl: null,
  },
];

// ─── Tests ──────────────────────────────────────────────────────────

describe("useProducts hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── useProductSearch ───────────────────────────────────

  describe("useProductSearch", () => {
    it("should fetch products and map the response", async () => {
      mockSearchRequest.mockResolvedValueOnce(mockProductApiResponse);

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(
        () => useProductSearch({ query: "angus" }),
        { wrapper: Wrapper }
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0]).toEqual(
        expect.objectContaining({
          id: "prod-1",
          title: "Angus Bull",
          slug: "angus-bull",
          basePrice: 15000,
          currency: "TRY",
          imageUrl:
            "https://api.livestock-trading.com/file-storage/products/angus-bull.jpg",
        })
      );
    });

    it("should handle products without cover image", async () => {
      mockSearchRequest.mockResolvedValueOnce(mockProductApiResponse);

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(
        () => useProductSearch({ query: "holstein" }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Product 2 has no coverImageUrl
      expect(result.current.data![1].imageUrl).toBeUndefined();
    });

    it("should handle error state", async () => {
      mockSearchRequest.mockRejectedValueOnce(new Error("Network error"));

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(
        () => useProductSearch({ query: "test" }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should pass correct default parameters to API", async () => {
      mockSearchRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      renderHook(() => useProductSearch({}), { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockSearchRequest).toHaveBeenCalled();
      });

      expect(mockSearchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "",
          countryCode: "TR",
          city: "",
          currency: "TRY",
          sortBy: "createdAt",
          pageRequest: expect.objectContaining({
            currentPage: 1,
            perPageCount: 8,
            listAll: false,
          }),
        })
      );
    });

    it("should pass custom parameters to API", async () => {
      mockSearchRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      renderHook(
        () =>
          useProductSearch({
            query: "cow",
            countryCode: "DE",
            currency: "EUR",
            currentPage: 2,
            perPageCount: 20,
          }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockSearchRequest).toHaveBeenCalled();
      });

      expect(mockSearchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "cow",
          countryCode: "DE",
          currency: "EUR",
          pageRequest: expect.objectContaining({
            currentPage: 2,
            perPageCount: 20,
          }),
        })
      );
    });
  });

  // ─── useProductList ─────────────────────────────────────

  describe("useProductList", () => {
    it("should fetch product list with filters", async () => {
      mockAllRequest.mockResolvedValueOnce(mockProductApiResponse);

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(
        () => useProductList({ categoryId: "cat-1" }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it("should include categoryId filter when provided", async () => {
      mockAllRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      renderHook(() => useProductList({ categoryId: "cat-1" }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(mockAllRequest).toHaveBeenCalled();
      });

      const callArgs = mockAllRequest.mock.calls[0][0];
      const categoryFilter = callArgs.filters.find(
        (f: { key: string }) => f.key === "categoryId"
      );
      expect(categoryFilter).toBeDefined();
      expect(categoryFilter.values).toEqual(["cat-1"]);
    });

    it("should include condition filter when provided", async () => {
      mockAllRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      renderHook(() => useProductList({ condition: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(mockAllRequest).toHaveBeenCalled();
      });

      const callArgs = mockAllRequest.mock.calls[0][0];
      const conditionFilter = callArgs.filters.find(
        (f: { key: string }) => f.key === "condition"
      );
      expect(conditionFilter).toBeDefined();
      expect(conditionFilter.values).toEqual([1]);
    });

    it("should include slug filter when provided", async () => {
      mockAllRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      renderHook(() => useProductList({ slug: "angus-bull" }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(mockAllRequest).toHaveBeenCalled();
      });

      const callArgs = mockAllRequest.mock.calls[0][0];
      const slugFilter = callArgs.filters.find(
        (f: { key: string }) => f.key === "slug"
      );
      expect(slugFilter).toBeDefined();
      expect(slugFilter.values).toEqual(["angus-bull"]);
    });

    it("should respect the enabled option", async () => {
      mockAllRequest.mockResolvedValueOnce([]);

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(
        () => useProductList({}, { enabled: false }),
        { wrapper: Wrapper }
      );

      // Should not fetch when disabled
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockAllRequest).not.toHaveBeenCalled();
    });
  });

  // ─── useProductDetail ───────────────────────────────────

  describe("useProductDetail", () => {
    it("should fetch product detail by ID", async () => {
      const mockDetailResponse = {
        id: "prod-1",
        title: "Angus Bull",
        slug: "angus-bull",
        description: "A fine Angus bull for sale",
        basePrice: 15000,
        currency: "TRY",
      };

      mockDetailRequest.mockResolvedValueOnce(mockDetailResponse);

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(() => useProductDetail("prod-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDetailResponse);
      expect(mockDetailRequest).toHaveBeenCalledWith({ id: "prod-1" });
    });

    it("should not fetch when productId is empty", async () => {
      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(() => useProductDetail(""), {
        wrapper: Wrapper,
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockDetailRequest).not.toHaveBeenCalled();
    });

    it("should not fetch when enabled is false", async () => {
      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(
        () => useProductDetail("prod-1", { enabled: false }),
        { wrapper: Wrapper }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockDetailRequest).not.toHaveBeenCalled();
    });

    it("should handle detail API error", async () => {
      mockDetailRequest.mockRejectedValueOnce(new Error("Product not found"));

      const { Wrapper } = createQueryWrapper();

      const { result } = renderHook(() => useProductDetail("prod-999"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });
});
