import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { convexQuery } from '@/lib/convex';
import { CardWithTableSkeleton } from '@/components/admin/skeletons';
import { Plus, Pencil, Trash2, GripVertical, FileText, Video, Layers } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/lessons/')({
	loader: async ({ context }) => {
		// Skip on server - auth not available during SSR
		if (typeof window === 'undefined') return;

		// Await prefetch - with preload on hover, data is cached for instant navigation
		await context.queryClient.prefetchQuery(
			convexQuery(api.lessons.listLessonsWithHierarchy, {})
		);
	},
	component: LessonsPage,
});

function LessonsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteLesson = useMutation(api.lessons.deleteLesson);

	const handleDelete = async () => {
		if (!deleteId) return;

		setIsDeleting(true);
		try {
			await deleteLesson({ id: deleteId });
			toast.success('Lesson deleted successfully');
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete lesson'
			);
		} finally {
			setIsDeleting(false);
			setDeleteId(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header renders immediately - no data needed */}
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

			{/* Data component suspends until ready */}
			<Suspense fallback={<CardWithTableSkeleton rows={5} filterWidth="w-[320px]" />}>
				<LessonsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			{/* Delete dialog - always available */}
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
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function LessonsCard({ onDeleteRequest }: { onDeleteRequest: (id: string) => void }) {
	// Single query - data already prefetched by loader
	const { data } = useSuspenseQuery(
		convexQuery(api.lessons.listLessonsWithHierarchy, {})
	);

	const { lessons, hierarchy } = data;
	const { subjects, chapters, sections } = hierarchy;

	const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

	// Filter lessons by selected section
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

	const getContentTypeIcon = (contentType: string) => {
		switch (contentType) {
			case 'video':
				return <Video className="h-4 w-4" />;
			case 'interactive':
				return <Layers className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

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
				{filteredLessons.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						{selectedSectionId === 'all'
							? 'No lessons yet. Create your first lesson to get started.'
							: 'No lessons in this section. Create one to get started.'}
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12" />
								<TableHead>Title</TableHead>
								<TableHead>Section</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Duration</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Order</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLessons.map((lesson) => {
								const section = sectionMap.get(lesson.sectionId);
								const chapter = section ? chapterMap.get(section.chapterId) : null;
								return (
									<TableRow key={lesson._id}>
										<TableCell>
											<GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
										</TableCell>
										<TableCell className="font-medium">
											{lesson.title}
										</TableCell>
										<TableCell className="text-muted-foreground">
											<div className="flex flex-col">
												<span className="text-xs">{chapter?.name ?? lesson.chapterName ?? 'Unknown'}</span>
												<span>{section?.name ?? lesson.sectionName ?? 'Unknown'}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1.5 text-muted-foreground">
												{getContentTypeIcon(lesson.contentType)}
												<span className="capitalize">{lesson.contentType}</span>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{lesson.estimatedMinutes} min
										</TableCell>
										<TableCell>
											<Badge
												variant={lesson.isActive ? 'default' : 'secondary'}
											>
												{lesson.isActive ? 'Active' : 'Draft'}
											</Badge>
										</TableCell>
										<TableCell>{lesson.order}</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="ghost" size="icon" asChild>
													<Link
														to="/admin/lessons/$lessonId"
														params={{ lessonId: lesson._id }}
													>
														<Pencil className="h-4 w-4" />
														<span className="sr-only">Edit</span>
													</Link>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => onDeleteRequest(lesson._id)}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete</span>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
