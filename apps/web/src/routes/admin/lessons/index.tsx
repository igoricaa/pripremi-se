import { Suspense, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@pripremi-se/backend/convex/_generated/api';
import { convexQuery } from '@/lib/convex';
import { CardWithTableSkeleton } from '@/components/admin/skeletons';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { getLessonColumns } from './columns';

export const Route = createFileRoute('/admin/lessons/')({
	loader: async ({ context }) => {
		if (typeof window === 'undefined') return;

		context.queryClient.prefetchQuery(
			convexQuery(api.lessons.listLessonsWithHierarchy, {})
		);
	},
	component: LessonsPage,
});

function LessonsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteLesson = useMutation(
		api.lessons.deleteLesson
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(
			api.lessons.listLessonsWithHierarchy,
			{}
		);
		if (current === undefined) return;
		const updated = {
			...current,
			lessons: current.lessons.filter((item) => item._id !== args.id),
		};
		localStore.setQuery(api.lessons.listLessonsWithHierarchy, {}, updated);
		toast.success('Lesson deleted successfully');
	});

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteLesson({ id: idToDelete });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete lesson'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Lessons</h1>
					<p className="text-muted-foreground">Manage curriculum lessons</p>
				</div>
				<Button asChild>
					<Link to="/admin/lessons/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Lesson
					</Link>
				</Button>
			</div>

			<Suspense fallback={<CardWithTableSkeleton preset="lessons" rows={20} filterWidth="w-[320px]" />}>
				<LessonsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Lesson</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this lesson? This action cannot
							be undone. All associated files will also be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function LessonsCard({ onDeleteRequest }: { onDeleteRequest: (id: string) => void }) {
	const { data } = useSuspenseQuery(
		convexQuery(api.lessons.listLessonsWithHierarchy, {})
	);

	const { lessons, hierarchy } = data;
	const { subjects, chapters, sections } = hierarchy;

	const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

	const filteredLessons =
		selectedSectionId === 'all'
			? lessons
			: lessons.filter((l) => l.sectionId === selectedSectionId);

	// Create lookup maps for table rendering
	const sectionMap = new Map(sections.map((s) => [s._id, s]));
	const chapterMap = new Map(chapters.map((c) => [c._id, c]));
	const subjectMap = new Map(subjects.map((s) => [s._id as string, s.name]));

	// Group sections by chapter, chapters by subject for the dropdown
	const sectionsByChapter = new Map<string, typeof sections>();
	for (const section of sections) {
		const chapterId = section.chapterId as string;
		if (!sectionsByChapter.has(chapterId)) {
			sectionsByChapter.set(chapterId, []);
		}
		sectionsByChapter.get(chapterId)?.push(section);
	}

	const chaptersBySubject = new Map<string, typeof chapters>();
	for (const chapter of chapters) {
		const subjectId = chapter.subjectId as string;
		if (!chaptersBySubject.has(subjectId)) {
			chaptersBySubject.set(subjectId, []);
		}
		chaptersBySubject.get(subjectId)?.push(chapter);
	}

	const columns = getLessonColumns({ sectionMap, chapterMap, onDelete: onDeleteRequest });

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>All Lessons</CardTitle>
						<CardDescription>
							{filteredLessons.length} lesson
							{filteredLessons.length !== 1 ? 's' : ''}{' '}
							{selectedSectionId !== 'all' ? 'in selected section' : 'total'}
						</CardDescription>
					</div>
					<Select
						value={selectedSectionId}
						onValueChange={setSelectedSectionId}
					>
						<SelectTrigger className="w-[320px]">
							<SelectValue placeholder="Filter by section" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Sections</SelectItem>
							{Array.from(subjectMap.entries()).map(([subjectId, subjectName]) => {
								const subjectChapters = chaptersBySubject.get(subjectId) ?? [];
								return (
									<div key={subjectId}>
										<div className="px-2 py-1.5 font-bold text-muted-foreground text-xs">
											{subjectName}
										</div>
										{subjectChapters.map((chapter) => {
											const chapterSections = sectionsByChapter.get(chapter._id) ?? [];
											return (
												<div key={chapter._id}>
													<div className="px-4 py-1 font-semibold text-muted-foreground text-xs">
														{chapter.name}
													</div>
													{chapterSections.map((section) => (
														<SelectItem key={section._id} value={section._id} className="pl-6">
															{section.name}
														</SelectItem>
													))}
												</div>
											);
										})}
									</div>
								);
							})}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={filteredLessons}
					defaultPageSize={20}
				/>
			</CardContent>
		</Card>
	);
}
