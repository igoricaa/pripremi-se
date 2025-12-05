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
import { QueryError } from '@/components/QueryError';
import { useQueryWithStatus } from '@/lib/convex';

export const Route = createFileRoute('/admin/')({
	component: AdminDashboard,
});

interface StatCardProps {
	title: string;
	value: number | undefined;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	isLoading: boolean;
}

function StatCard({
	title,
	value,
	description,
	icon: Icon,
	isLoading,
}: StatCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">
					{isLoading ? (
						<span className="text-muted-foreground">...</span>
					) : (
						value ?? 0
					)}
				</div>
				<p className="text-muted-foreground text-xs">{description}</p>
			</CardContent>
		</Card>
	)
}

function AdminDashboard() {
	const subjectsQuery = useQueryWithStatus(api.subjects.listSubjects);
	const chaptersQuery = useQueryWithStatus(api.chapters.listChapters);
	const sectionsQuery = useQueryWithStatus(api.sections.listSections);
	const lessonsQuery = useQueryWithStatus(api.lessons.listLessons);
	const testsQuery = useQueryWithStatus(api.tests.listTests);
	const questionsQuery = useQueryWithStatus(api.questions.listAllQuestions);

	const queries = [
		subjectsQuery,
		chaptersQuery,
		sectionsQuery,
		lessonsQuery,
		testsQuery,
		questionsQuery,
	];

	const isPending = queries.some((q) => q.isPending);
	const errorQuery = queries.find((q) => q.isError);

	if (errorQuery?.isError) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">
						Overview of your curriculum content
					</p>
				</div>
				<QueryError
					error={errorQuery.error}
					title="Failed to load dashboard data"
				/>
			</div>
		);
	}

	const stats = [
		{
			title: 'Subjects',
			value: subjectsQuery.data?.length,
			description: 'Total curriculum subjects',
			icon: BookOpen,
		},
		{
			title: 'Chapters',
			value: chaptersQuery.data?.length,
			description: 'Organized by subject',
			icon: FolderTree,
		},
		{
			title: 'Sections',
			value: sectionsQuery.data?.length,
			description: 'Chapter subdivisions',
			icon: Layers,
		},
		{
			title: 'Lessons',
			value: lessonsQuery.data?.length,
			description: 'Learning content pieces',
			icon: FileText,
		},
		{
			title: 'Tests',
			value: testsQuery.data?.length,
			description: 'Assessment modules',
			icon: ListChecks,
		},
		{
			title: 'Questions',
			value: questionsQuery.data?.length,
			description: 'Question bank items',
			icon: HelpCircle,
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">
					Overview of your curriculum content
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{stats.map((stat) => (
					<StatCard
						key={stat.title}
						title={stat.title}
						value={stat.value}
						description={stat.description}
						icon={stat.icon}
						isLoading={isPending}
					/>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
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

				<Card>
					<CardHeader>
						<CardTitle>Content Status</CardTitle>
						<CardDescription>Publishing overview</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Active Subjects</span>
								<span className="font-medium">
									{subjectsQuery.data?.filter((s) => s.isActive).length ?? 0} /{' '}
									{subjectsQuery.data?.length ?? 0}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Active Lessons</span>
								<span className="font-medium">
									{lessonsQuery.data?.filter((l) => l.isActive).length ?? 0} /{' '}
									{lessonsQuery.data?.length ?? 0}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Active Tests</span>
								<span className="font-medium">
									{testsQuery.data?.filter((t) => t.isActive).length ?? 0} /{' '}
									{testsQuery.data?.length ?? 0}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
