import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          // Don't retry on auth/client errors
          if (error.status === 401 || error.status === 403 || error.status === 404) return false;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Stable list-key helper for paginated queries. */
export function listKey(scope: string, ...parts: unknown[]) {
  return [scope, ...parts] as const;
}
