import { api } from '@pripremi-se/backend/convex/_generated/api';
import { CONTENT_TYPES, updateLessonSchema } from '@pripremi-se/shared';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useQueryWithStatus } from '@/lib/convex';

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
			contentType: (lesson?.contentType ?? 'text') as
				| 'text'
				| 'video'
				| 'interactive',
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
					<Button asChild size="icon" variant="ghost">
						<Link to="/admin/lessons">
							<ArrowLeft className="h-4 w-4" />
						</Link>
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
					<Button asChild size="icon" variant="ghost">
						<Link to="/admin/lessons">
							<ArrowLeft className="h-4 w-4" />
						</Link>
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
				<Button asChild size="icon" variant="ghost">
					<Link to="/admin/lessons">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Edit Lesson</h1>
					<p className="text-muted-foreground">
						Update the details for this lesson
					</p>
				</div>
			</div>

			<Tabs className="space-y-6" defaultValue="content">
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
					<TabsContent className="space-y-6" value="content">
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
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="e.g., Introduction to Linear Equations"
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

								<form.Field name="content">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="content">Content *</Label>
											<Textarea
												className="font-mono"
												id="content"
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Write the lesson content here... (Markdown supported)"
												rows={20}
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
							</CardContent>
						</Card>

						<div className="flex justify-between gap-4">
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
									<Link to="/admin/lessons">Cancel</Link>
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
					</TabsContent>

					<TabsContent className="space-y-6" value="media">
						<MediaLibrary lessonId={lessonId} />
					</TabsContent>

					<TabsContent className="space-y-6" value="settings">
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
												onValueChange={(value) =>
													field.handleChange(
														value as 'text' | 'video' | 'interactive'
													)
												}
												value={field.state.value}
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
												min={1}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														Number.parseInt(e.target.value) || 1
													)
												}
												type="number"
												value={field.state.value}
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
												min={0}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														Number.parseInt(e.target.value) || 0
													)
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
							</CardContent>
						</Card>

						<div className="flex justify-between gap-4">
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
									<Link to="/admin/lessons">Cancel</Link>
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
					</TabsContent>
				</form>
			</Tabs>

			<AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Lesson</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this lesson? This action cannot be
							undone.
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
