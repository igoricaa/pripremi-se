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
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/subjects/')({
	loader: async ({ context }) => {
		// Skip on server - auth not available during SSR
		if (typeof window === 'undefined') return;

		// Await prefetch - with preload on hover, data is cached for instant navigation
		await context.queryClient.prefetchQuery(
			convexQuery(api.subjects.listSubjects, {})
		);
	},
	component: SubjectsPage,
});

function SubjectsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteSubject = useMutation(api.subjects.deleteSubject);

	const handleDelete = async () => {
		if (!deleteId) return;

		setIsDeleting(true);
		try {
			await deleteSubject({ id: deleteId });
			toast.success('Subject deleted successfully');
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete subject'
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
					<h1 className="font-bold text-3xl tracking-tight">Subjects</h1>
					<p className="text-muted-foreground">Manage curriculum subjects</p>
				</div>
				<Button asChild>
					<Link to="/admin/subjects/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Subject
					</Link>
				</Button>
			</div>

			{/* Data component suspends until ready */}
			<Suspense fallback={<CardWithTableSkeleton rows={5} />}>
				<SubjectsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			{/* Delete dialog - always available */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Subject</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this subject? This action cannot
							be undone. All chapters, sections, and lessons under this subject
							must be deleted first.
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

function SubjectsCard({ onDeleteRequest }: { onDeleteRequest: (id: string) => void }) {
	// Single query - data already prefetched by loader
	const { data: subjects } = useSuspenseQuery(
		convexQuery(api.subjects.listSubjects, {})
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>All Subjects</CardTitle>
				<CardDescription>
					{subjects.length} subject{subjects.length !== 1 ? 's' : ''} total
				</CardDescription>
			</CardHeader>
			<CardContent>
				{subjects.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						No subjects yet. Create your first subject to get started.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12" />
								<TableHead>Name</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Order</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{subjects.map((subject) => (
								<TableRow key={subject._id}>
									<TableCell>
										<GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
									</TableCell>
									<TableCell className="font-medium">
										{subject.name}
									</TableCell>
									<TableCell className="font-mono text-muted-foreground text-sm">
										{subject.slug}
									</TableCell>
									<TableCell>
										<Badge
											variant={subject.isActive ? 'default' : 'secondary'}
										>
											{subject.isActive ? 'Active' : 'Draft'}
										</Badge>
									</TableCell>
									<TableCell>{subject.order}</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" asChild>
												<Link
													to="/admin/subjects/$subjectId"
													params={{ subjectId: subject._id }}
												>
													<Pencil className="h-4 w-4" />
													<span className="sr-only">Edit</span>
												</Link>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => onDeleteRequest(subject._id)}
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
