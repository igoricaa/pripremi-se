import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { convexQuery } from '@/lib/convex';
import { CardWithTableSkeleton } from '@/components/admin/skeletons';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
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

export const Route = createFileRoute('/admin/chapters/')({
	loader: async ({ context }) => {
		// Skip on server - auth not available during SSR
		if (typeof window === 'undefined') return;

		// Await prefetch - with preload on hover, data is cached for instant navigation
		await context.queryClient.prefetchQuery(
			convexQuery(api.chapters.listChaptersWithSubjects, {})
		);
	},
	component: ChaptersPage,
});

function ChaptersPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteChapter = useMutation(api.chapters.deleteChapter);

	const handleDelete = async () => {
		if (!deleteId) return;

		setIsDeleting(true);
		try {
			await deleteChapter({ id: deleteId });
			toast.success('Chapter deleted successfully');
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete chapter'
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
					<h1 className="font-bold text-3xl tracking-tight">Chapters</h1>
					<p className="text-muted-foreground">Manage curriculum chapters</p>
				</div>
				<Button asChild>
					<Link to="/admin/chapters/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Chapter
					</Link>
				</Button>
			</div>

			{/* Data component suspends until ready */}
			<Suspense fallback={<CardWithTableSkeleton rows={5} filterWidth="w-[200px]" />}>
				<ChaptersCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			{/* Delete dialog - always available */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Chapter</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this chapter? This action cannot
							be undone. All sections and lessons under this chapter must be
							deleted first.
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

function ChaptersCard({ onDeleteRequest }: { onDeleteRequest: (id: string) => void }) {
	// Single query - data already prefetched by loader
	const { data } = useSuspenseQuery(
		convexQuery(api.chapters.listChaptersWithSubjects, {})
	);

	const { chapters, subjects } = data;

	const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

	// Filter chapters by selected subject
	const filteredChapters =
		selectedSubjectId === 'all'
			? chapters
			: chapters.filter((ch) => ch.subjectId === selectedSubjectId);

	// Create a lookup map for subject names
	const subjectMap = new Map(subjects.map((s) => [s._id, s.name]));

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>All Chapters</CardTitle>
						<CardDescription>
							{filteredChapters.length} chapter
							{filteredChapters.length !== 1 ? 's' : ''}{' '}
							{selectedSubjectId !== 'all' ? 'in selected subject' : 'total'}
						</CardDescription>
					</div>
					<Select
						value={selectedSubjectId}
						onValueChange={setSelectedSubjectId}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Filter by subject" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Subjects</SelectItem>
							{subjects.map((subject) => (
								<SelectItem key={subject._id} value={subject._id}>
									{subject.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				{filteredChapters.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						{selectedSubjectId === 'all'
							? 'No chapters yet. Create your first chapter to get started.'
							: 'No chapters in this subject. Create one to get started.'}
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12" />
								<TableHead>Name</TableHead>
								<TableHead>Subject</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Order</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredChapters.map((chapter) => (
								<TableRow key={chapter._id}>
									<TableCell>
										<GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
									</TableCell>
									<TableCell className="font-medium">{chapter.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{subjectMap.get(chapter.subjectId) ?? chapter.subjectName ?? 'Unknown'}
									</TableCell>
									<TableCell className="font-mono text-muted-foreground text-sm">
										{chapter.slug}
									</TableCell>
									<TableCell>
										<Badge
											variant={chapter.isActive ? 'default' : 'secondary'}
										>
											{chapter.isActive ? 'Active' : 'Draft'}
										</Badge>
									</TableCell>
									<TableCell>{chapter.order}</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" asChild>
												<Link
													to="/admin/chapters/$chapterId"
													params={{ chapterId: chapter._id }}
												>
													<Pencil className="h-4 w-4" />
													<span className="sr-only">Edit</span>
												</Link>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => onDeleteRequest(chapter._id)}
											>
												<Trash2 className="h-4 w-4" />
												<span className="sr-only">Delete</span>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
