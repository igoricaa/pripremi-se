import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useForm } from '@tanstack/react-form';
import { updateLessonSchema, CONTENT_TYPES } from '@pripremi-se/shared';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { useState } from 'react';

export const Route = createFileRoute('/admin/lessons/$lessonId')({
	component: EditLessonPage,
});

function EditLessonPage() {
	const { lessonId } = Route.useParams();
	const navigate = useNavigate();
	const {
		data: lesson,
		isPending,
		isError,
		error,
	} = useQueryWithStatus(api.lessons.getLessonById, { id: lessonId });
	const { data: sections } = useQueryWithStatus(api.sections.listSections);
	const { data: chapters } = useQueryWithStatus(api.chapters.listChapters);
	const { data: subjects } = useQueryWithStatus(api.subjects.listSubjects);
	const updateLesson = useMutation(api.lessons.updateLesson);
	const deleteLesson = useMutation(api.lessons.deleteLesson);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const form = useForm({
		defaultValues: {
			title: lesson?.title ?? '',
			content: lesson?.content ?? '',
			contentType: (lesson?.contentType ?? 'text') as 'text' | 'video' | 'interactive',
			estimatedMinutes: lesson?.estimatedMinutes ?? 5,
			order: lesson?.order ?? 0,
			isActive: lesson?.isActive ?? false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = updateLessonSchema.parse({
					id: lessonId,
					title: value.title,
					content: value.content,
					contentType: value.contentType,
					estimatedMinutes: value.estimatedMinutes,
					slug: undefined, // Slug is read-only, not updated
					order: value.order,
					isActive: value.isActive,
				});

				await updateLesson(data);
				toast.success('Lesson updated successfully');
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to update lesson'
				);
			}
		},
	});

	// Reset form when lesson data loads
	if (lesson && form.state.values.title === '' && lesson.title !== '') {
		form.reset({
			title: lesson.title,
			content: lesson.content ?? '',
			contentType: lesson.contentType as 'text' | 'video' | 'interactive',
			estimatedMinutes: lesson.estimatedMinutes ?? 5,
			order: lesson.order ?? 0,
			isActive: lesson.isActive ?? false,
		});
	}

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">Loading lesson...</div>
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
						onClick={() => navigate({ to: '/admin/lessons' })}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Error Loading Lesson
						</h1>
						<p className="text-muted-foreground">
							Failed to load lesson details
						</p>
					</div>
				</div>
				<QueryError error={error} title="Failed to load lesson" />
			</div>
		);
	}

	if (lesson === null) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate({ to: '/admin/lessons' })}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Lesson Not Found
						</h1>
						<p className="text-muted-foreground">
							The lesson you're looking for doesn't exist
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Get the section, chapter, and subject names for display
	const section = sections?.find((s) => s._id === lesson.sectionId);
	const chapter = chapters?.find((c) => c._id === section?.chapterId);
	const subject = subjects?.find((s) => s._id === chapter?.subjectId);

	const handleDelete = async () => {
		try {
			await deleteLesson({ id: lessonId });
			toast.success('Lesson deleted successfully');
			navigate({ to: '/admin/lessons' });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete lesson'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: '/admin/lessons' })}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Edit Lesson</h1>
					<p className="text-muted-foreground">
						Update the details for this lesson
					</p>
				</div>
			</div>

			<Tabs defaultValue="content" className="space-y-6">
				<TabsList>
					<TabsTrigger value="content">Content</TabsTrigger>
					<TabsTrigger value="media">Media</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<TabsContent value="content" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Lesson Content</CardTitle>
								<CardDescription>
									Edit the main content for this lesson
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<form.Field name="title">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="title">Title *</Label>
											<Input
												id="title"
												placeholder="e.g., Introduction to Linear Equations"
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

								<form.Field name="content">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="content">Content *</Label>
											<Textarea
												id="content"
												placeholder="Write the lesson content here... (Markdown supported)"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												rows={20}
												className="font-mono"
											/>
											{field.state.meta.errors.length > 0 && (
												<p className="text-destructive text-sm">
													{field.state.meta.errors.join(', ')}
												</p>
											)}
										</div>
									)}
								</form.Field>
							</CardContent>
						</Card>

						<div className="flex justify-between gap-4">
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
									onClick={() => navigate({ to: '/admin/lessons' })}
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
					</TabsContent>

					<TabsContent value="media" className="space-y-6">
						<MediaLibrary lessonId={lessonId} />
					</TabsContent>

					<TabsContent value="settings" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Lesson Settings</CardTitle>
								<CardDescription>Configure lesson settings</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label>Location</Label>
									<div className="rounded-md border bg-muted/50 px-3 py-2 text-muted-foreground text-sm">
										{subject?.name ?? 'Unknown'} &rarr;{' '}
										{chapter?.name ?? 'Unknown'} &rarr;{' '}
										{section?.name ?? 'Unknown'}
									</div>
									<p className="text-muted-foreground text-xs">
										To change the section, create a new lesson instead
									</p>
								</div>

								<form.Field name="contentType">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="contentType">Content Type</Label>
											<Select
												value={field.state.value}
												onValueChange={(value) =>
													field.handleChange(
														value as 'text' | 'video' | 'interactive'
													)
												}
											>
												<SelectTrigger id="contentType">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={CONTENT_TYPES.TEXT}>
														Text
													</SelectItem>
													<SelectItem value={CONTENT_TYPES.VIDEO}>
														Video
													</SelectItem>
													<SelectItem value={CONTENT_TYPES.INTERACTIVE}>
														Interactive
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</form.Field>

								<form.Field name="estimatedMinutes">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="estimatedMinutes">
												Estimated Duration (min)
											</Label>
											<Input
												id="estimatedMinutes"
												type="number"
												min={1}
												value={field.state.value}
												onChange={(e) =>
													field.handleChange(
														Number.parseInt(e.target.value) || 1
													)
												}
												onBlur={field.handleBlur}
											/>
										</div>
									)}
								</form.Field>

								<div className="space-y-2">
									<Label htmlFor="slug">Slug</Label>
									<div className="text-muted-foreground text-sm rounded-md border bg-muted/50 px-3 py-2">
										{lesson.slug}
									</div>
									<p className="text-muted-foreground text-xs">
										Auto-generated from title
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
													field.handleChange(
														Number.parseInt(e.target.value) || 0
													)
												}
												onBlur={field.handleBlur}
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

						<div className="flex justify-between gap-4">
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
									onClick={() => navigate({ to: '/admin/lessons' })}
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
					</TabsContent>
				</form>
			</Tabs>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Lesson</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this lesson? This action cannot
							be undone.
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
