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
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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

  const navBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.5rem",
    color: "var(--text-muted)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    transition: "all var(--duration-fast) var(--ease-out)",
  };

  const navBtnDisabled: React.CSSProperties = {
    opacity: 0.4,
    cursor: "not-allowed",
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-3 sm:px-6"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      {/* Mobile view */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="btn btn-secondary"
          style={!hasPrev ? navBtnDisabled : undefined}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="btn btn-secondary"
          style={!hasNext ? navBtnDisabled : undefined}
        >
          Next
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Showing{" "}
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {startItem}
            </span>{" "}
            to{" "}
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {endItem}
            </span>{" "}
            of{" "}
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {totalItems}
            </span>{" "}
            results
          </p>
        </div>
        <div className="flex items-center" style={{ gap: "1rem" }}>
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center" style={{ gap: "0.5rem" }}>
              <label
                htmlFor="items-per-page"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Per page:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="input"
                style={{
                  width: "auto",
                  padding: "0.375rem 2rem 0.375rem 0.75rem",
                  fontSize: "0.875rem",
                }}
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
            className="isolate inline-flex"
            style={{
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
              border: "1px solid var(--border)",
            }}
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrev}
              style={{
                ...navBtnStyle,
                borderRight: "none",
                borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
                border: "none",
                ...(!hasPrev ? navBtnDisabled : {}),
              }}
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
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      background: "var(--surface)",
                      borderLeft: "1px solid var(--border)",
                      fontFamily: "var(--font-body)",
                    }}
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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    border: "none",
                    borderLeft: "1px solid var(--border)",
                    transition: "all var(--duration-fast) var(--ease-out)",
                    ...(isActive
                      ? {
                          background: "linear-gradient(135deg, var(--brand-600), var(--brand-700))",
                          color: "white",
                          zIndex: 10,
                          boxShadow: "0 1px 2px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                        }
                      : {
                          background: "var(--surface)",
                          color: "var(--text-primary)",
                        }),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--surface-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--surface)";
                    }
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext}
              style={{
                ...navBtnStyle,
                borderLeft: "1px solid var(--border)",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                borderRadius: "0 var(--radius-lg) var(--radius-lg) 0",
                ...(!hasNext ? navBtnDisabled : {}),
              }}
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
