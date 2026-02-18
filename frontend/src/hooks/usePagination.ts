import { useState, useMemo } from "react";
import { paginate, type PaginatedResult } from "../utils/performance";

interface UsePaginationOptions {
  initialPage?: number;
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  itemsPerPage: number;
  paginatedData: PaginatedResult<T>;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setItemsPerPage: (count: number) => void;
}

/**
 * Custom hook for handling pagination
 */
export function usePagination<T>(
  data: T[] | undefined,
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { initialPage = 1, itemsPerPage: initialItemsPerPage = 10 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Memoize paginated data to avoid recalculation on every render
  const paginatedData = useMemo(() => {
    if (!data) {
      return {
        items: [],
        totalPages: 0,
        currentPage: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
      };
    }
    return paginate(data, currentPage, itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, paginatedData.totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (paginatedData.hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (paginatedData.hasPrev) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(paginatedData.totalPages);
  };

  const handleSetItemsPerPage = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return {
    currentPage,
    itemsPerPage,
    paginatedData,
    setPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage: handleSetItemsPerPage,
  };
}
