import { useState, useCallback } from "react";

// Optimistic update hook for better UX during mutations
export function useOptimisticUpdates<T extends { _id: string }>() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<T>>>(new Map());

  const applyOptimisticUpdate = useCallback((id: string, updates: Partial<T>) => {
    setOptimisticUpdates(prev => new Map(prev.set(id, { ...prev.get(id), ...updates })));
  }, []);

  const clearOptimisticUpdate = useCallback((id: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const clearAllOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates(new Map());
  }, []);

  const getOptimisticItem = useCallback((item: T): T => {
    const updates = optimisticUpdates.get(item._id);
    return updates ? { ...item, ...updates } : item;
  }, [optimisticUpdates]);

  const applyOptimisticUpdates = useCallback((items: T[]): T[] => {
    return items.map(getOptimisticItem);
  }, [getOptimisticItem]);

  return {
    optimisticUpdates,
    applyOptimisticUpdate,
    clearOptimisticUpdate,
    clearAllOptimisticUpdates,
    getOptimisticItem,
    applyOptimisticUpdates,
  };
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useState(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'ctrl',
        e.metaKey && 'cmd',
        e.shiftKey && 'shift',
        e.altKey && 'alt',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');

      const shortcut = shortcuts[key];
      if (shortcut) {
        e.preventDefault();
        shortcut();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
}

// Advanced form validation hook
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validators: Partial<Record<keyof T, (value: T[keyof T], formData: T) => string | null>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const validate = useCallback((fieldsToValidate?: (keyof T)[]): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    const fields = fieldsToValidate || Object.keys(validators);

    fields.forEach(field => {
      const validator = validators[field];
      if (validator) {
        const error = validator(values[field], values);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validators]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
  };
}

// Loading state management
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => new Map(prev.set(key, isLoading)));
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates.get(key) || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Array.from(loadingStates.values()).some(loading => loading);
  }, [loadingStates]);

  return { setLoading, isLoading, isAnyLoading };
}

// Data fetching with caching
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < ttl) {
            setData(cachedData);
            return;
          }
        } catch {
          // Invalid cache, continue with fetch
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      
      // Cache the result
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  // Auto-fetch on mount
  useState(() => {
    fetchData();
  });

  return { data, loading, error, refetch: () => fetchData(true) };
}