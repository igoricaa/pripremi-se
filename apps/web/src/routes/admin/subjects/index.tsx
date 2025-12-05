import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useQueryWithStatus } from '@/lib/convex';
import { QueryError } from '@/components/QueryError';
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
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/subjects/')({
	component: SubjectsPage,
});

function SubjectsPage() {
	const { data: subjects, isPending, isError, error } = useQueryWithStatus(
		api.subjects.listSubjects
	);
	const deleteSubject = useMutation(api.subjects.deleteSubject);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

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

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">Loading subjects...</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Subjects</h1>
					<p className="text-muted-foreground">Manage curriculum subjects</p>
				</div>
				<QueryError error={error} title="Failed to load subjects" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Subjects</h1>
					<p className="text-muted-foreground">
						Manage curriculum subjects
					</p>
				</div>
				<Button asChild>
					<Link to="/admin/subjects/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Subject
					</Link>
				</Button>
			</div>

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
											{subject.icon && (
												<span className="mr-2">{subject.icon}</span>
											)}
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
												<Button
													variant='ghost'
													size='icon'
													asChild
												>
													<Link to="/admin/subjects/$subjectId" params={{ subjectId: subject._id }}>
														<Pencil className='h-4 w-4' />
														<span className='sr-only'>Edit</span>
													</Link>
												</Button>
												<Button
													variant='ghost'
													size='icon'
													onClick={() => setDeleteId(subject._id)}
												>
													<Trash2 className='h-4 w-4' />
													<span className='sr-only'>Delete</span>
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
	)
}
