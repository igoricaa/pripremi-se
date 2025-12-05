import {
	createFileRoute,
	Navigate,
	Outlet,
	redirect,
} from '@tanstack/react-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const Route = createFileRoute('/admin')({
	beforeLoad: ({ context, location }) => {
		// SSR: Redirect to sign-in if not authenticated
		if (typeof window === 'undefined' && !context.userId) {
			throw redirect({
				to: '/sign-in',
				search: { redirect: location.href },
			})
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
	const canAccessCurriculum = useQuery(api.userProfiles.canAccessCurriculum);
	const isAdmin = useQuery(api.userProfiles.isAdmin);

	// Show loading state while checking auth
	if (isAuthLoading || canAccessCurriculum === undefined) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	// Redirect to sign-in if not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/sign-in" />;
	}

	// Redirect to home if not editor or admin
	if (!canAccessCurriculum) {
		return <Navigate to="/" />;
	}

	return (
		<div className="flex h-screen bg-background">
			<AdminSidebar isAdmin={isAdmin ?? false} />
			<main className="flex-1 overflow-auto">
				<div className="container py-6">
					<Outlet />
				</div>
			</main>
		</div>
	)
}
