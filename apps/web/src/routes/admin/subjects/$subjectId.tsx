import { api } from '@pripremi-se/backend/convex/_generated/api';
import { updateSubjectSchema } from '@pripremi-se/shared';
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

export const Route = createFileRoute('/admin/subjects/$subjectId')({
	component: EditSubjectPage,
});

function EditSubjectPage() {
	const { subjectId } = Route.useParams();
	const navigate = useNavigate();
	const {
		data: subject,
		isPending,
		isError,
		error,
	} = useQueryWithStatus(api.subjects.getSubjectById, { id: subjectId });
	const updateSubject = useMutation(api.subjects.updateSubject);
	const deleteSubject = useMutation(api.subjects.deleteSubject);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const form = useForm({
		defaultValues: {
			name: subject?.name ?? '',
			description: subject?.description ?? '',
			icon: subject?.icon ?? '',
			order: subject?.order ?? 0,
			isActive: subject?.isActive ?? false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = updateSubjectSchema.parse({
					id: subjectId,
					name: value.name,
					description: value.description || undefined,
					icon: value.icon || undefined,
					slug: undefined, // Slug is read-only, not updated
					order: value.order,
					isActive: value.isActive,
				});

				await updateSubject(data);
				toast.success('Subject updated successfully');
				navigate({ to: '/admin/subjects' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to update subject'
				);
			}
		},
	});

	// Reset form when subject data loads
	if (subject && form.state.values.name === '' && subject.name !== '') {
		form.reset({
			name: subject.name,
			description: subject.description ?? '',
			icon: subject.icon ?? '',
			order: subject.order ?? 0,
			isActive: subject.isActive ?? false,
		});
	}

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">Loading subject...</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link to="/admin/subjects">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Error Loading Subject
						</h1>
						<p className="text-muted-foreground">
							Failed to load subject details
						</p>
					</div>
				</div>
				<QueryError error={error} title="Failed to load subject" />
			</div>
		);
	}

	if (subject === null) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link to="/admin/subjects">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Subject Not Found
						</h1>
						<p className="text-muted-foreground">
							The subject you're looking for doesn't exist
						</p>
					</div>
				</div>
			</div>
		);
	}

	const handleDelete = async () => {
		try {
			await deleteSubject({ id: subjectId });
			toast.success('Subject deleted successfully');
			navigate({ to: '/admin/subjects' });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete subject'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link to="/admin/subjects">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Edit Subject</h1>
					<p className="text-muted-foreground">
						Update the details for this subject
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
						<CardTitle>Subject Details</CardTitle>
						<CardDescription>
							Update the information for this subject
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="name">Name *</Label>
									<Input
										id="name"
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g., Mathematics"
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
										placeholder="A brief description of this subject..."
										rows={3}
										value={field.state.value}
									/>
								</div>
							)}
						</form.Field>

						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="icon">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor="icon">Icon (emoji)</Label>
										<Input
											id="icon"
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g., emoji"
											value={field.state.value}
										/>
									</div>
								)}
							</form.Field>

							<div className="space-y-2">
								<Label htmlFor="slug">Slug</Label>
								<div className="text-muted-foreground text-sm rounded-md border bg-muted/50 px-3 py-2">
									{subject.slug}
								</div>
								<p className="text-muted-foreground text-xs">
									Auto-generated from name
								</p>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
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
						</div>
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
							<Link to="/admin/subjects">Cancel</Link>
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
						<AlertDialogTitle>Delete Subject</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this subject? This action cannot
							be undone. All chapters, sections, and lessons under this subject
							must be deleted first.
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
