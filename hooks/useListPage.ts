import { useState, useDeferredValue, useCallback } from "react";

interface UseListPageOptions<S extends string> {
  defaultSort: S;
  perPage?: number;
}

/**
 * Shared state management for list pages (sellers, transporters, etc.)
 * Handles search, sort, pagination with deferred search for performance.
 */
export function useListPage<S extends string>({ defaultSort, perPage = 12 }: UseListPageOptions<S>) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState<S>(defaultSort);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSortChange = useCallback((value: S) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  const handleNextPage = useCallback(() => setCurrentPage((p) => p + 1), []);
  const handlePrevPage = useCallback(() => setCurrentPage((p) => p - 1), []);

  const hasMore = useCallback(
    (itemCount: number) => itemCount >= perPage,
    [perPage]
  );

  return {
    searchQuery,
    setSearchQuery,
    deferredSearch,
    sortBy,
    handleSortChange,
    currentPage,
    setCurrentPage,
    handleNextPage,
    handlePrevPage,
    hasMore,
    perPage,
  };
}
