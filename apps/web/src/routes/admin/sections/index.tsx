import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useQueryWithStatus } from '@/lib/convex';
import { QueryError } from '@/components/QueryError';
import { TableSkeleton } from '@/components/admin/skeletons';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';
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

export const Route = createFileRoute('/admin/sections/')({
	component: SectionsPage,
});

function SectionsPage() {
	const {
		data: sections,
		isPending: isSectionsPending,
		isError: isSectionsError,
		error: sectionsError,
	} = useQueryWithStatus(api.sections.listSections);

	const { data: chapters, isPending: isChaptersPending } = useQueryWithStatus(
		api.chapters.listChapters
	);

	const { data: subjects, isPending: isSubjectsPending } = useQueryWithStatus(
		api.subjects.listSubjects
	);

	const deleteSection = useMutation(api.sections.deleteSection);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

	const handleDelete = async () => {
		if (!deleteId) return;

		setIsDeleting(true);
		try {
			await deleteSection({ id: deleteId });
			toast.success('Section deleted successfully');
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete section'
			);
		} finally {
			setIsDeleting(false);
			setDeleteId(null);
		}
	};

	const isPending = isSectionsPending || isChaptersPending || isSubjectsPending;

	if (isPending) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sections</h1>
					<p className="text-muted-foreground">Manage curriculum sections</p>
				</div>
				<TableSkeleton />
			</div>
		);
	}

	if (isSectionsError) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sections</h1>
					<p className="text-muted-foreground">Manage curriculum sections</p>
				</div>
				<QueryError error={sectionsError} title="Failed to load sections" />
			</div>
		);
	}

	// Filter sections by selected chapter
	const filteredSections =
		selectedChapterId === 'all'
			? sections
			: sections?.filter((s) => s.chapterId === selectedChapterId);

	// Create lookup maps
	const chapterMap = new Map(chapters?.map((c) => [c._id, c]) ?? []);
	const subjectMap = new Map(subjects?.map((s) => [s._id as string, s.name]) ?? []);

	// Group chapters by subject for the dropdown
	const chaptersBySubject = new Map<string, NonNullable<typeof chapters>>();
	for (const chapter of chapters ?? []) {
		const subjectId = chapter.subjectId as string;
		if (!chaptersBySubject.has(subjectId)) {
			chaptersBySubject.set(subjectId, []);
		}
		chaptersBySubject.get(subjectId)?.push(chapter);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sections</h1>
					<p className="text-muted-foreground">Manage curriculum sections</p>
				</div>
				<Button asChild>
					<Link to="/admin/sections/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Section
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>All Sections</CardTitle>
							<CardDescription>
								{filteredSections?.length ?? 0} section
								{(filteredSections?.length ?? 0) !== 1 ? 's' : ''}{' '}
								{selectedChapterId !== 'all' ? 'in selected chapter' : 'total'}
							</CardDescription>
						</div>
						<Select
							value={selectedChapterId}
							onValueChange={setSelectedChapterId}
						>
							<SelectTrigger className="w-[280px]">
								<SelectValue placeholder="Filter by chapter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Chapters</SelectItem>
								{Array.from(chaptersBySubject.entries()).map(
									([subjectId, subjectChapters]) => (
										<div key={subjectId}>
											<div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
												{subjectMap.get(subjectId) ?? 'Unknown Subject'}
											</div>
											{subjectChapters?.map((chapter) => (
												<SelectItem key={chapter._id} value={chapter._id}>
													{chapter.name}
												</SelectItem>
											))}
										</div>
									)
								)}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					{!filteredSections || filteredSections.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							{selectedChapterId === 'all'
								? 'No sections yet. Create your first section to get started.'
								: 'No sections in this chapter. Create one to get started.'}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12" />
									<TableHead>Name</TableHead>
									<TableHead>Chapter</TableHead>
									<TableHead>Slug</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Order</TableHead>
									<TableHead className="w-24">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredSections.map((section) => {
									const chapter = chapterMap.get(section.chapterId);
									return (
										<TableRow key={section._id}>
											<TableCell>
												<GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
											</TableCell>
											<TableCell className="font-medium">
												{section.name}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{chapter?.name ?? 'Unknown'}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-sm">
												{section.slug}
											</TableCell>
											<TableCell>
												<Badge
													variant={section.isActive ? 'default' : 'secondary'}
												>
													{section.isActive ? 'Active' : 'Draft'}
												</Badge>
											</TableCell>
											<TableCell>{section.order}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button variant="ghost" size="icon" asChild>
														<Link
															to="/admin/sections/$sectionId"
															params={{ sectionId: section._id }}
														>
															<Pencil className="h-4 w-4" />
															<span className="sr-only">Edit</span>
														</Link>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setDeleteId(section._id)}
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

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Section</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this section? This action cannot
							be undone. All lessons under this section must be deleted first.
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
