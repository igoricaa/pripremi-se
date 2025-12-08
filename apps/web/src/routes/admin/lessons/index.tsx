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

			<Suspense fallback={<CardWithTableSkeleton preset="lessons" rows={20} filterWidth="w-[500px]" />}>
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

function LessonsCard({
	onDeleteRequest,
}: { onDeleteRequest: (id: string) => void }) {
	const { data } = useSuspenseQuery(
		convexQuery(api.lessons.listLessonsWithHierarchy, {})
	);

	const { lessons, hierarchy } = data;
	const { subjects, chapters, sections } = hierarchy;

	// Filter states for cascading dropdowns
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
	const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
	const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

	// Create lookup maps for table rendering
	const sectionMap = new Map(sections.map((s) => [s._id, s]));
	const chapterMap = new Map(chapters.map((c) => [c._id, c]));

	// Cascading reset handlers
	const handleSubjectChange = (value: string) => {
		setSelectedSubjectId(value);
		setSelectedChapterId('all');
		setSelectedSectionId('all');
	};

	const handleChapterChange = (value: string) => {
		setSelectedChapterId(value);
		setSelectedSectionId('all');
	};

	// Chapters available based on selected subject
	const availableChapters =
		selectedSubjectId === 'all'
			? chapters
			: chapters.filter((c) => c.subjectId === selectedSubjectId);

	// Sections available based on selected chapter (or subject if no chapter selected)
	const availableSections = (() => {
		if (selectedChapterId !== 'all') {
			return sections.filter((s) => s.chapterId === selectedChapterId);
		}
		if (selectedSubjectId !== 'all') {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === selectedSubjectId)
					.map((c) => c._id)
			);
			return sections.filter((s) => chapterIds.has(s.chapterId));
		}
		return sections;
	})();

	// Filter lessons based on all selected levels
	const filteredLessons = (() => {
		if (selectedSectionId !== 'all') {
			return lessons.filter((l) => l.sectionId === selectedSectionId);
		}
		if (selectedChapterId !== 'all') {
			const sectionIds = new Set(
				sections
					.filter((s) => s.chapterId === selectedChapterId)
					.map((s) => s._id)
			);
			return lessons.filter((l) => sectionIds.has(l.sectionId));
		}
		if (selectedSubjectId !== 'all') {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === selectedSubjectId)
					.map((c) => c._id)
			);
			const sectionIds = new Set(
				sections.filter((s) => chapterIds.has(s.chapterId)).map((s) => s._id)
			);
			return lessons.filter((l) => sectionIds.has(l.sectionId));
		}
		return lessons;
	})();

	// Determine description text
	const filterDescription =
		selectedSectionId !== 'all'
			? 'in selected section'
			: selectedChapterId !== 'all'
				? 'in selected chapter'
				: selectedSubjectId !== 'all'
					? 'in selected subject'
					: 'total';

	const columns = getLessonColumns({
		sectionMap,
		chapterMap,
		onDelete: onDeleteRequest,
	});

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>All Lessons</CardTitle>
						<CardDescription>
							{filteredLessons.length} lesson
							{filteredLessons.length !== 1 ? 's' : ''} {filterDescription}
						</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{/* Subject Filter */}
						<Select
							value={selectedSubjectId}
							onValueChange={handleSubjectChange}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="All Subjects" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Subjects</SelectItem>
								{subjects.map((s) => (
									<SelectItem key={s._id} value={s._id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Chapter Filter */}
						<Select
							value={selectedChapterId}
							onValueChange={handleChapterChange}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="All Chapters" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Chapters</SelectItem>
								{availableChapters.map((c) => (
									<SelectItem key={c._id} value={c._id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Section Filter */}
						<Select
							value={selectedSectionId}
							onValueChange={setSelectedSectionId}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="All Sections" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Sections</SelectItem>
								{availableSections.map((s) => (
									<SelectItem key={s._id} value={s._id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
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
