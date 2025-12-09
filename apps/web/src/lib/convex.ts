/**
 * Custom Convex hooks with enhanced status handling.
 *
 * Uses convex-helpers to provide richer query state management
 * with explicit status, error, and loading states.
 */
import { convexQuery } from '@convex-dev/react-query';
import { useQueries } from 'convex/react';
import { makeUseQueryWithStatus } from 'convex-helpers/react';

// Re-export convexQuery for use with TanStack Query loaders and useSuspenseQuery
export { convexQuery };

/**
 * Enhanced useQuery hook that returns explicit status states.
 *
 * @returns An object with:
 * - `status`: "success" | "pending" | "error"
 * - `data`: The query result (only defined when status is "success")
 * - `error`: Error object (only defined when status is "error")
 * - `isSuccess`: boolean
 * - `isPending`: boolean
 * - `isError`: boolean
 *
 * @example
 * ```tsx
 * const { data, isPending, isError, error } = useQueryWithStatus(api.users.get, { id });
 *
 * if (isPending) return <Spinner />;
 * if (isError) return <ErrorAlert error={error} />;
 * return <UserProfile user={data} />;
 * ```
 */
export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);
