import {
	createFileRoute,
	Navigate,
	Outlet,
	redirect,
} from '@tanstack/react-router';
import { useConvexAuth } from 'convex/react';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';

export const Route = createFileRoute('/_auth')({
	beforeLoad: ({ context, location }) => {
		if (typeof window === 'undefined' && !context.userId) {
			throw redirect({
				to: '/sign-in',
				search: { redirect: location.href },
			});
		}
	},
	component: AuthLayout,
});

function AuthLayout() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/sign-in" />;
	}

	return (
		<>
			<div className="container py-4">
				<EmailVerificationBanner />
			</div>
			<Outlet />
		</>
	);
}
