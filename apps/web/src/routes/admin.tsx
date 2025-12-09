import { api } from '@pripremi-se/backend/convex/_generated/api';
import {
	createFileRoute,
	Navigate,
	Outlet,
	redirect,
} from '@tanstack/react-router';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import { Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { PageSkeleton } from '@/components/admin/skeletons';
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { useQueryWithStatus } from '@/lib/convex';

export const Route = createFileRoute('/admin')({
	beforeLoad: ({ context, location }) => {
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
	const accessQuery = useQueryWithStatus(api.userProfiles.getAdminAccess);

	if (accessQuery.isError) {
		return <Navigate to="/" />;
	}

	if (accessQuery.data && !accessQuery.data.canAccess) {
		return <Navigate to="/" />;
	}

	return (
		<SidebarProvider>
			<AdminSidebar isAdmin={accessQuery.data?.isAdmin ?? false} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
				</header>
				<main className="flex-1 overflow-auto p-6">
					<Suspense fallback={<PageSkeleton />}>
						<Outlet />
					</Suspense>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
