import { useState, useRef, useEffect } from "react";
import { 
  Search, 
  X, 
  ChevronDown, 
  Calendar,
  Hash,
  Type,
  Tag,
  SlidersHorizontal
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

export interface SearchFilter {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "date" | "dateRange" | "multiSelect";
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  placeholder?: string;
  filters?: SearchFilter[];
  showFilterButton?: boolean;
  debounceMs?: number;
  delay?: number; // Backward compatibility
  className?: string;
  value?: string;
  autoFocus?: boolean;
}

const FILTER_ICONS = {
  text: Type,
  select: Tag,
  number: Hash,
  date: Calendar,
  dateRange: Calendar,
  multiSelect: Tag,
};

export default function SearchBar({
  onSearch,
  onFilter,
  placeholder = "Search...",
  filters = [],
  showFilterButton = true,
  debounceMs,
  delay = 300, // Backward compatibility
  className = "",
  value = "",
  autoFocus = false,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  
  // Use debounceMs if provided, otherwise fall back to delay for backward compatibility
  const effectiveDelay = debounceMs ?? delay;
  const debouncedSearch = useDebounce(searchValue, effectiveDelay);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && searchRef.current) {
      searchRef.current.focus();
    }
  }, [autoFocus]);

  // Handle search with debouncing
  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  // Handle external value changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Count active filters
  useEffect(() => {
    const count = Object.values(filterValues).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== "" && value !== null && value !== undefined;
    }).length;
    setActiveFiltersCount(count);
  }, [filterValues]);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFilters]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilterValues = { ...filterValues, [key]: value };
    
    // Remove empty values
    if (value === "" || value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilterValues[key];
    }
    
    setFilterValues(newFilterValues);
    onFilter?.(newFilterValues);
  };

  const clearAllFilters = () => {
    setFilterValues({});
    onFilter?.({});
  };

  const clearSearch = () => {
    setSearchValue("");
    onSearch("");
  };

  const renderFilterInput = (filter: SearchFilter) => {
    const value = filterValues[filter.key];
    const Icon = FILTER_ICONS[filter.type];
    
    switch (filter.type) {
      case "text":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon size={14} className="inline mr-1" />
              {filter.label}
            </label>
            <input
              type="text"
              value={value || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              placeholder={filter.placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
      
      case "select":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon size={14} className="inline mr-1" />
              {filter.label}
            </label>
            <select
              value={value || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      case "multiSelect":
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon size={14} className="inline mr-1" />
              {filter.label}
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {filter.options?.map((option) => (
                <label key={option.value} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => {
                      let newValues = [...selectedValues];
                      if (e.target.checked) {
                        newValues.push(option.value);
                      } else {
                        newValues = newValues.filter(v => v !== option.value);
                      }
                      handleFilterChange(filter.key, newValues);
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case "number":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon size={14} className="inline mr-1" />
              {filter.label}
            </label>
            <input
              type="number"
              value={value || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              placeholder={filter.placeholder}
              min={filter.min}
              max={filter.max}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
      
      case "date":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon size={14} className="inline mr-1" />
              {filter.label}
            </label>
            <input
              type="date"
              value={value || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
      
      case "dateRange":
        const dateRange = value || { start: "", end: "" };
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon size={14} className="inline mr-1" />
              {filter.label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start || ""}
                onChange={(e) => handleFilterChange(filter.key, { ...dateRange, start: e.target.value })}
                placeholder="From"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={dateRange.end || ""}
                onChange={(e) => handleFilterChange(filter.key, { ...dateRange, end: e.target.value })}
                placeholder="To"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            ref={searchRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Button */}
        {showFilterButton && filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div
          ref={filtersRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 z-20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all ({activeFiltersCount})
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
