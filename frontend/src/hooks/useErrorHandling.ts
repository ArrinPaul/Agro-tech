import { useState, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";
import { getFriendlyErrorMessage } from "../utils/errors";

/**
 * Configuration for retry behavior
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Hook for wrapping Convex mutations with error handling and retry logic
 */
export function useMutationWithErrorHandling() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const execute = useCallback(
    async <T>(
      mutationFn: () => Promise<T>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
        retryConfig?: Partial<RetryConfig>;
        onSuccess?: (result: T) => void;
        onError?: (error: unknown) => void;
        silent?: boolean; // Don't show toast
      }
    ): Promise<T | null> => {
      const config = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig };
      setIsLoading(true);
      setError(null);
      abortRef.current = false;

      let lastError: unknown;

      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        if (abortRef.current) break;

        try {
          const result = await mutationFn();
          setIsLoading(false);

          if (options?.successMessage && !options?.silent) {
            addToast(options.successMessage, "success");
          }

          options?.onSuccess?.(result);
          return result;
        } catch (err: unknown) {
          lastError = err;
          const errorMsg = getFriendlyErrorMessage(err);

          // Don't retry validation errors or auth errors
          if (isNonRetryableError(err)) {
            setError(errorMsg);
            setIsLoading(false);

            if (!options?.silent) {
              addToast(options?.errorMessage || errorMsg, "error");
            }

            options?.onError?.(err);
            return null;
          }

          // If there are retries left, wait and try again
          if (attempt < config.maxRetries) {
            const delay = Math.min(
              config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
              config.maxDelayMs
            );

            if (!options?.silent) {
              addToast(`Connection issue. Retrying in ${Math.round(delay / 1000)}s... (${attempt + 1}/${config.maxRetries})`, "warning");
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // All retries exhausted
      const finalErrorMsg = getFriendlyErrorMessage(lastError);
      setError(finalErrorMsg);
      setIsLoading(false);

      if (!options?.silent) {
        addToast(options?.errorMessage || `Failed after ${config.maxRetries} retries: ${finalErrorMsg}`, "error");
      }

      options?.onError?.(lastError);
      return null;
    },
    [addToast]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { execute, isLoading, error, abort, clearError };
}

/**
 * Hook for handling network connectivity
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { addToast } = useToast();

  useState(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast("Connection restored", "success");
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast("You are offline. Changes will sync when connected.", "warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  return { isOnline };
}

/**
 * Determine if an error is retryable
 * Validation errors, auth errors, and permission errors should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  const message = typeof error === "object" && error !== null && "message" in error
    ? String((error as { message: string }).message)
    : String(error);

  const nonRetryablePatterns = [
    "not authenticated",
    "unauthorized",
    "permission",
    "not found",
    "cannot delete",
    "cannot be negative",
    "must be greater",
    "must be at least",
    "already exists",
    "insufficient",
    "exceeds",
    "invalid",
    "validation",
    "total capacity cannot",
    "cannot delete warehouse",
    "cannot delete crop",
    "cannot delete resource",
  ];

  const lowerMessage = message.toLowerCase();
  return nonRetryablePatterns.some((pattern) => lowerMessage.includes(pattern));
}

/**
 * Higher-order function to wrap any async operation with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const conf = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= conf.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (isNonRetryableError(err) || attempt === conf.maxRetries) {
        throw err;
      }

      const delay = Math.min(
        conf.baseDelayMs * Math.pow(conf.backoffMultiplier, attempt),
        conf.maxDelayMs
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
