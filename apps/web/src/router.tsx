import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary';
import { NotFound } from './components/NotFound';
import { routeTree } from './routeTree.gen';

export function getRouter() {
	const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
	if (!CONVEX_URL) {
		console.error('missing envar VITE_CONVEX_URL');
	}

	const convex = new ConvexReactClient(CONVEX_URL, {
		unsavedChangesWarning: false,
	});
	const convexQueryClient = new ConvexQueryClient(convex);

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
				staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
				gcTime: 5 * 1000, // Cache for 5 seconds
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = routerWithQueryClient(
		createRouter({
			routeTree,
			defaultPreload: 'intent',
			defaultPreloadStaleTime: 30_000, // Keep preloaded data fresh for 30s
			defaultErrorComponent: DefaultCatchBoundary,
			defaultNotFoundComponent: () => <NotFound />,
			scrollRestoration: true,
			context: { queryClient, convexClient: convex, convexQueryClient },
			Wrap: ({ children }: { children: React.ReactNode }) => (
				<ConvexProvider client={convexQueryClient.convexClient}>
					{children}
				</ConvexProvider>
			),
		}),
		queryClient
	);

	return router;
}
