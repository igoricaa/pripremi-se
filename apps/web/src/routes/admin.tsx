import {
	createFileRoute,
	Navigate,
	Outlet,
	redirect,
} from '@tanstack/react-router';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { QueryError } from '@/components/QueryError';
import { useQueryWithStatus } from '@/lib/convex';
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar';

export const Route = createFileRoute('/admin')({
	beforeLoad: ({ context, location }) => {
		// SSR: Redirect to sign-in if not authenticated
		if (typeof window === 'undefined' && !context.userId) {
			throw redirect({
				to: '/sign-in',
				search: { redirect: location.href },
			});
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<>
			<AuthLoading>
				<div className="flex h-screen items-center justify-center">
					<div className="text-muted-foreground">Loading...</div>
				</div>
			</AuthLoading>
			<Unauthenticated>
				<Navigate to="/sign-in" />
			</Unauthenticated>
			<Authenticated>
				<AdminLayoutContent />
			</Authenticated>
		</>
	);
}

function AdminLayoutContent() {
	const accessQuery = useQueryWithStatus(api.userProfiles.canAccessCurriculum);
	const adminQuery = useQueryWithStatus(api.userProfiles.isAdmin);

	// Show loading state while checking permissions
	if (accessQuery.isPending) {
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

	// Redirect to home if not editor or admin
	if (!accessQuery.data) {
		return <Navigate to="/" />;
	}

	return (
		<SidebarProvider>
			<AdminSidebar isAdmin={adminQuery.data ?? false} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
				</header>
				<main className="flex-1 overflow-auto p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
