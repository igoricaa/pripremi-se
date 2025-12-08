import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import {
	BookOpen,
	FileText,
	FolderTree,
	HelpCircle,
	Layers,
	ListChecks,
} from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { StatsGridSkeleton } from '@/components/admin/skeletons';
import { convexQuery } from '@/lib/convex';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/admin/')({
	loader: async ({ context }) => {
		if (typeof window === 'undefined' || !context.userId) {
			return;
		}

		context.queryClient.prefetchQuery(
			convexQuery(api.dashboard.getStats, {})
		);
	},
	component: AdminDashboard,
});

interface StatCardProps {
	title: string;
	value: number;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{value}</div>
				<p className="text-muted-foreground text-xs">{description}</p>
			</CardContent>
		</Card>
	);
}

function AdminDashboard() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">
					Overview of your curriculum content
				</p>
			</div>

			<Suspense fallback={<StatsGridSkeleton />}>
				<StatsGrid />
			</Suspense>

			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
					<CardDescription>Common administrative tasks</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-2">
					<p className="text-muted-foreground text-sm">
						Use the sidebar to navigate to different content types and manage
						your curriculum.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

function StatsGrid() {
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.dashboard.getStats, {})
	);

	const statItems = [
		{
			title: 'Subjects',
			value: stats.subjects,
			description: 'Total curriculum subjects',
			icon: BookOpen,
		},
		{
			title: 'Chapters',
			value: stats.chapters,
			description: 'Organized by subject',
			icon: FolderTree,
		},
		{
			title: 'Sections',
			value: stats.sections,
			description: 'Chapter subdivisions',
			icon: Layers,
		},
		{
			title: 'Lessons',
			value: stats.lessons,
			description: 'Learning content pieces',
			icon: FileText,
		},
		{
			title: 'Tests',
			value: stats.tests,
			description: 'Assessment modules',
			icon: ListChecks,
		},
		{
			title: 'Questions',
			value: stats.questions,
			description: 'Question bank items',
			icon: HelpCircle,
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{statItems.map((stat) => (
				<StatCard
					key={stat.title}
					title={stat.title}
					value={stat.value}
					description={stat.description}
					icon={stat.icon}
				/>
			))}
		</div>
	);
}
