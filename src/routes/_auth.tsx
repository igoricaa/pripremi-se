import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
	beforeLoad: ({ context, location }) => {
		if (!context.userId) {
			throw redirect({
				to: '/sign-in',
				search: { redirect: location.href },
			});
		}
		// Pass user to child routes
		// return { userId: context.userId };
	},
	component: Outlet,
});
