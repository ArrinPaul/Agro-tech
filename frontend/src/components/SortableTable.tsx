import { useState, useMemo, type ReactNode } from "react";
import { ChevronUp, ChevronDown, Filter, EyeOff } from "lucide-react";
import { Skeleton } from "./Skeleton";

export interface BaseSortableTableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  className?: string;
  render?: (item: T, index: number) => ReactNode;
  filterType?: "text" | "select" | "number" | "date";
  filterOptions?: { value: string; label: string }[];
}

export interface SortableTableProps<T = unknown> {
  columns: BaseSortableTableColumn<T>[];
  data: T[];
  loading?: boolean;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  idKey?: string;
  emptyStateText?: string;
  className?: string;
  showColumnVisibility?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
}

export default function SortableTable<T extends Record<string, unknown>>({
  columns: initialColumns,
  data,
  loading = false,
  onSort,
  onFilter,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  idKey = "_id",
  emptyStateText = "No data available",
  className = "",
  showColumnVisibility = true,
  stickyHeader = true,
  maxHeight = "max-h-96",
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Filter visible columns
  const visibleColumns = useMemo(() => 
    initialColumns.filter(col => !hiddenColumns.has(col.key)),
    [initialColumns, hiddenColumns]
  );

  // Handle sorting
  const handleSort = (key: string) => {
    let newDirection: "asc" | "desc" = "asc";
    
    if (sortKey === key) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    
    setSortKey(key);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  // Handle filtering
  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...filters, [key]: value };
    if (!value || value === "") {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  // Handle selection
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === data.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange?.([]);
    } else {
      const allIds = data.map(item => String(item[idKey]));
      onSelectionChange?.(allIds);
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(columnKey)) {
      newHidden.delete(columnKey);
    } else {
      newHidden.add(columnKey);
    }
    setHiddenColumns(newHidden);
  };

  const renderFilterInput = (column: BaseSortableTableColumn<T>) => {
    const value = (filters[column.key] as string) || "";
    
    switch (column.filterType) {
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            className="w-full px-2 py-1 text-xs border rounded" style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <option value="">All</option>
            {column.filterOptions?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            placeholder="Filter..."
            className="w-full px-2 py-1 text-xs border rounded" style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          />
        );
      
      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            className="w-full px-2 py-1 text-xs border rounded" style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          />
        );
      
      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            placeholder="Filter..."
            className="w-full px-2 py-1 text-xs border rounded" style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          />
        );
    }
  };

  return (
    <div className={`card ${className}`}>
      {/* Table Header Controls */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          {selectable && selectedIds.length > 0 && (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {selectedIds.length} selected
            </span>
          )}
        </div>
        
        {showColumnVisibility && (
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-2 px-3 py-1 text-sm border rounded border-[var(--border)] hover:bg-[var(--surface-hover)]"
            >
              <EyeOff size={14} />
              Columns
            </button>
            
            {showColumnMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowColumnMenu(false)}
                />
                <div className="absolute top-full right-0 mt-1 rounded-lg shadow-lg py-2 z-20 min-w-[180px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  {initialColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 px-3 py-1 hover:bg-[var(--surface-hover)] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.has(column.key)}
                        onChange={() => toggleColumnVisibility(column.key)}
                        className="rounded"
                      />
                      <span className="text-sm">{column.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="w-full">
          <thead className={`${stickyHeader ? "sticky top-0 z-10" : ""}`} style={{ background: "var(--surface-hover)" }}>
            <tr>
              {/* Selection checkbox */}
              {selectable && (
                <th className="w-12 p-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(ref) => {
                      if (ref) ref.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
              )}
              
              {/* Column headers */}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`p-3 text-left ${column.className || ""}`}
                  style={{ width: column.width }}
                >
                  <div className="space-y-2">
                    {/* Header with sorting */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          column.sortable ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" : ""
                        }`}
                        style={{ color: "var(--text-primary)" }}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        {column.label}
                      </span>
                      
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            size={12}
                            className={`${
                              sortKey === column.key && sortDirection === "asc"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-400"
                            }`}
                          />
                          <ChevronDown
                            size={12}
                            className={`-mt-1 ${
                              sortKey === column.key && sortDirection === "desc"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Filter input */}
                    {column.filterable && (
                      <div className="relative">
                        {renderFilterInput(column)}
                        {!!filters[column.key] && (
                          <Filter size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {selectable && <td className="p-3"><Skeleton className="w-4 h-4" /></td>}
                  {visibleColumns.map((column) => (
                    <td key={column.key} className="p-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={(selectable ? 1 : 0) + visibleColumns.length} className="p-8 text-center">
                  <div style={{ color: "var(--text-muted)" }}>
                    <div className="text-4xl mb-2">📊</div>
                    <div className="font-medium">{emptyStateText}</div>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((item, index) => {
                const itemId = String(item[idKey]);
                const isSelected = selectedIds.includes(itemId);
                
                return (
                  <tr
                    key={itemId}
                    className={`hover:bg-[var(--surface-hover)] transition-colors ${
                      isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(itemId)}
                          className="rounded"
                        />
                      </td>
                    )}
                    
                    {/* Data cells */}
                    {visibleColumns.map((column) => (
                      <td key={column.key} className={`p-3 ${column.className || ""}`}>
                        {column.render ? column.render(item, index) : String(item[column.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}