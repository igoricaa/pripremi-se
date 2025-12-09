import { api } from '@pripremi-se/backend/convex/_generated/api';
import { updateChapterSchema } from '@pripremi-se/shared';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { QueryError } from '@/components/QueryError';
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
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useQueryWithStatus } from '@/lib/convex';

export const Route = createFileRoute('/admin/chapters/$chapterId')({
	component: EditChapterPage,
});

function EditChapterPage() {
	const { chapterId } = Route.useParams();
	const navigate = useNavigate();
	const {
		data: chapter,
		isPending,
		isError,
		error,
	} = useQueryWithStatus(api.chapters.getChapterById, { id: chapterId });
	const { data: subjects } = useQueryWithStatus(api.subjects.listSubjects);
	const updateChapter = useMutation(api.chapters.updateChapter);
	const deleteChapter = useMutation(api.chapters.deleteChapter);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const form = useForm({
		defaultValues: {
			name: chapter?.name ?? '',
			description: chapter?.description ?? '',
			order: chapter?.order ?? 0,
			isActive: chapter?.isActive ?? false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = updateChapterSchema.parse({
					id: chapterId,
					name: value.name,
					description: value.description || undefined,
					slug: undefined, // Slug is read-only, not updated
					order: value.order,
					isActive: value.isActive,
				});

				await updateChapter(data);
				toast.success('Chapter updated successfully');
				navigate({ to: '/admin/chapters' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to update chapter'
				);
			}
		},
	});

	// Reset form when chapter data loads
	if (chapter && form.state.values.name === '' && chapter.name !== '') {
		form.reset({
			name: chapter.name,
			description: chapter.description ?? '',
			order: chapter.order ?? 0,
			isActive: chapter.isActive ?? false,
		});
	}

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">Loading chapter...</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link to="/admin/chapters">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Error Loading Chapter
						</h1>
						<p className="text-muted-foreground">
							Failed to load chapter details
						</p>
					</div>
				</div>
				<QueryError error={error} title="Failed to load chapter" />
			</div>
		);
	}

	if (chapter === null) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link to="/admin/chapters">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Chapter Not Found
						</h1>
						<p className="text-muted-foreground">
							The chapter you're looking for doesn't exist
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Get the subject name for display
	const subjectName =
		subjects?.find((s) => s._id === chapter.subjectId)?.name ?? 'Unknown';

	const handleDelete = async () => {
		try {
			await deleteChapter({ id: chapterId });
			toast.success('Chapter deleted successfully');
			navigate({ to: '/admin/chapters' });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete chapter'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link to="/admin/chapters">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Edit Chapter</h1>
					<p className="text-muted-foreground">
						Update the details for this chapter in {subjectName}
					</p>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle>Chapter Details</CardTitle>
						<CardDescription>
							Update the information for this chapter
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label>Subject</Label>
							<div className="text-muted-foreground text-sm rounded-md border bg-muted/50 px-3 py-2">
								{subjectName}
							</div>
							<p className="text-muted-foreground text-xs">
								To change the subject, create a new chapter instead
							</p>
						</div>

						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="name">Name *</Label>
									<Input
										id="name"
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g., Introduction to Algebra"
										value={field.state.value}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-sm">
											{field.state.meta.errors.join(', ')}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="A brief description of this chapter..."
										rows={3}
										value={field.state.value}
									/>
								</div>
							)}
						</form.Field>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="slug">Slug</Label>
								<div className="text-muted-foreground text-sm rounded-md border bg-muted/50 px-3 py-2">
									{chapter.slug}
								</div>
								<p className="text-muted-foreground text-xs">
									Auto-generated from name
								</p>
							</div>

							<form.Field name="order">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor="order">Display Order</Label>
										<Input
											id="order"
											min={0}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(Number.parseInt(e.target.value) || 0)
											}
											type="number"
											value={field.state.value}
										/>
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="isActive">
							{(field) => (
								<div className="space-y-2">
									<Label>Status</Label>
									<div className="flex items-center space-x-2 pt-2">
										<Switch
											checked={field.state.value}
											id="isActive"
											onCheckedChange={field.handleChange}
										/>
										<Label className="font-normal" htmlFor="isActive">
											{field.state.value ? 'Published' : 'Draft'}
										</Label>
									</div>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<div className="mt-6 flex justify-between gap-4">
					<Button
						onClick={() => setShowDeleteDialog(true)}
						type="button"
						variant="destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</Button>
					<div className="flex gap-4">
						<Button asChild type="button" variant="outline">
							<Link to="/admin/chapters">Cancel</Link>
						</Button>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button disabled={!canSubmit || isSubmitting} type="submit">
									{isSubmitting ? 'Saving...' : 'Save Changes'}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</div>
			</form>

			<AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
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
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
