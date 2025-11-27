import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/dashboard')({
	component: RouteComponent,
});

function RouteComponent() {
	const { userId } = Route.useRouteContext();

	return <div>Hello "/dashboard"!</div>;
}
