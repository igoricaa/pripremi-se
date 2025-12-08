import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useForm } from '@tanstack/react-form';
import { updateSectionSchema } from '@pripremi-se/shared';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
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
import { useQueryWithStatus } from '@/lib/convex';
import { QueryError } from '@/components/QueryError';
import { useState } from 'react';

export const Route = createFileRoute('/admin/sections/$sectionId')({
	component: EditSectionPage,
});

function EditSectionPage() {
	const { sectionId } = Route.useParams();
	const navigate = useNavigate();
	const {
		data: section,
		isPending,
		isError,
		error,
	} = useQueryWithStatus(api.sections.getSectionById, { id: sectionId });
	const { data: chapters } = useQueryWithStatus(api.chapters.listChapters);
	const { data: subjects } = useQueryWithStatus(api.subjects.listSubjects);
	const updateSection = useMutation(api.sections.updateSection);
	const deleteSection = useMutation(api.sections.deleteSection);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const form = useForm({
		defaultValues: {
			name: section?.name ?? '',
			description: section?.description ?? '',
			order: section?.order ?? 0,
			isActive: section?.isActive ?? false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = updateSectionSchema.parse({
					id: sectionId,
					name: value.name,
					description: value.description || undefined,
					slug: undefined, // Slug is read-only, not updated
					order: value.order,
					isActive: value.isActive,
				});

				await updateSection(data);
				toast.success('Section updated successfully');
				navigate({ to: '/admin/sections' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to update section'
				);
			}
		},
	});

	// Reset form when section data loads
	if (section && form.state.values.name === '' && section.name !== '') {
		form.reset({
			name: section.name,
			description: section.description ?? '',
			order: section.order ?? 0,
			isActive: section.isActive ?? false,
		});
	}

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">Loading section...</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate({ to: '/admin/sections' })}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Error Loading Section
						</h1>
						<p className="text-muted-foreground">
							Failed to load section details
						</p>
					</div>
				</div>
				<QueryError error={error} title="Failed to load section" />
			</div>
		);
	}

	if (section === null) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate({ to: '/admin/sections' })}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Section Not Found
						</h1>
						<p className="text-muted-foreground">
							The section you're looking for doesn't exist
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Get the chapter and subject names for display
	const chapter = chapters?.find((c) => c._id === section.chapterId);
	const chapterName = chapter?.name ?? 'Unknown';
	const subjectName = subjects?.find((s) => s._id === chapter?.subjectId)?.name ?? 'Unknown';

	const handleDelete = async () => {
		try {
			await deleteSection({ id: sectionId });
			toast.success('Section deleted successfully');
			navigate({ to: '/admin/sections' });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete section'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: '/admin/sections' })}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Edit Section</h1>
					<p className="text-muted-foreground">
						Update the details for this section
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
						<CardTitle>Section Details</CardTitle>
						<CardDescription>
							Update the information for this section
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label>Location</Label>
							<div className="text-muted-foreground text-sm rounded-md border bg-muted/50 px-3 py-2">
								{subjectName} → {chapterName}
							</div>
							<p className="text-muted-foreground text-xs">
								To change the chapter, create a new section instead
							</p>
						</div>

						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="name">Name *</Label>
									<Input
										id="name"
										placeholder="e.g., Linear Equations"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
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
										placeholder="A brief description of this section..."
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										rows={3}
									/>
								</div>
							)}
						</form.Field>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="slug">Slug</Label>
								<div className="text-muted-foreground text-sm rounded-md border bg-muted/50 px-3 py-2">
									{section.slug}
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
											type="number"
											min={0}
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(Number.parseInt(e.target.value) || 0)
											}
											onBlur={field.handleBlur}
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
											id="isActive"
											checked={field.state.value}
											onCheckedChange={field.handleChange}
										/>
										<Label htmlFor="isActive" className="font-normal">
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
						type="button"
						variant="destructive"
						onClick={() => setShowDeleteDialog(true)}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</Button>
					<div className="flex gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate({ to: '/admin/sections' })}
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? 'Saving...' : 'Save Changes'}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</div>
			</form>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Section</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this section? This action cannot
							be undone. All lessons under this section must be deleted first.
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
