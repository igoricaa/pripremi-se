import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/dashboard')({
	component: DashboardPage,
});

function DashboardPage() {
	const { userId } = Route.useRouteContext();

	if (!userId) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container py-8">
			<div>Hello Dashboard! {userId}</div>
		</div>
	);
}
