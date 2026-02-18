interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (count: number) => void;
  showItemsPerPage?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasNext,
  hasPrev,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current and adjacent pages
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
      {/* Mobile view */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div className="flex items-center gap-4">
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="items-per-page"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Per page:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrev}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {getPageNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    isActive
                      ? "z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      : "text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-offset-0"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
