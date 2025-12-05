import {
	createFileRoute,
	Navigate,
	Outlet,
	redirect,
} from '@tanstack/react-router';
import { useConvexAuth } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { QueryError } from '@/components/QueryError';
import { useQueryWithStatus } from '@/lib/convex';

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
	const accessQuery = useQueryWithStatus(api.userProfiles.canAccessCurriculum);
	const adminQuery = useQueryWithStatus(api.userProfiles.isAdmin);

	// Show loading state while checking auth
	if (isAuthLoading || accessQuery.isPending) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	// Show error if permission check failed
	if (accessQuery.isError) {
		return (
			<div className="flex h-screen items-center justify-center p-4">
				<QueryError
					error={accessQuery.error}
					title="Failed to verify permissions"
				/>
			</div>
		);
	}

	// Redirect to sign-in if not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/sign-in" />;
	}

	// Redirect to home if not editor or admin
	if (!accessQuery.data) {
		return <Navigate to="/" />;
	}

	return (
		<div className="flex h-screen bg-background">
			<AdminSidebar isAdmin={adminQuery.data ?? false} />
			<main className="flex-1 overflow-auto">
				<div className="container py-6">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
