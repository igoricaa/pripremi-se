import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useQueryWithStatus } from '@/lib/convex';
import { useForm } from '@tanstack/react-form';
import { createLessonSchema, CONTENT_TYPES } from '@pripremi-se/shared';
import { ArrowLeft } from 'lucide-react';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/lessons/new')({
	component: NewLessonPage,
});

function NewLessonPage() {
	const navigate = useNavigate();
	const createLesson = useMutation(api.lessons.createLesson);
	const subjectsQuery = useQueryWithStatus(api.subjects.listSubjects);
	const chaptersQuery = useQueryWithStatus(api.chapters.listChapters);
	const sectionsQuery = useQueryWithStatus(api.sections.listSections);
	const lessonsQuery = useQueryWithStatus(api.lessons.listLessons);

	const form = useForm({
		defaultValues: {
			sectionId: '',
			title: '',
			content: '',
			contentType: 'text' as 'text' | 'video' | 'interactive',
			estimatedMinutes: 5,
			order: 0,
			isActive: false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = createLessonSchema.parse({
					sectionId: value.sectionId,
					title: value.title,
					content: value.content,
					contentType: value.contentType,
					estimatedMinutes: value.estimatedMinutes,
					slug: undefined, // Always auto-generated
					order: value.order,
					isActive: value.isActive,
				});

				const lessonId = await createLesson(data);
				toast.success('Lesson created successfully');
				navigate({ to: '/admin/lessons/$lessonId', params: { lessonId } });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to create lesson'
				);
			}
		},
	});

	// Calculate lessons in selected section for order hint
	const selectedSectionId = form.state.values.sectionId;
	const lessonsInSection =
		lessonsQuery.data?.filter((l) => l.sectionId === selectedSectionId) ?? [];

	// When section changes, update the order to be the next available
	const handleSectionChange = (sectionId: string) => {
		form.setFieldValue('sectionId', sectionId);
		const lessonsInNewSection =
			lessonsQuery.data?.filter((l) => l.sectionId === sectionId) ?? [];
		form.setFieldValue('order', lessonsInNewSection.length);
	};

	// Group sections by chapter, chapters by subject
	const subjectMap = new Map(
		subjectsQuery.data?.map((s) => [s._id as string, s.name]) ?? []
	);

	const sectionsByChapter = new Map<string, NonNullable<typeof sectionsQuery.data>>();
	for (const section of sectionsQuery.data ?? []) {
		const chapterId = section.chapterId as string;
		if (!sectionsByChapter.has(chapterId)) {
			sectionsByChapter.set(chapterId, []);
		}
		sectionsByChapter.get(chapterId)?.push(section);
	}

	const chaptersBySubject = new Map<string, NonNullable<typeof chaptersQuery.data>>();
	for (const chapter of chaptersQuery.data ?? []) {
		const subjectId = chapter.subjectId as string;
		if (!chaptersBySubject.has(subjectId)) {
			chaptersBySubject.set(subjectId, []);
		}
		chaptersBySubject.get(subjectId)?.push(chapter);
	}

	const isPending =
		subjectsQuery.isPending ||
		chaptersQuery.isPending ||
		sectionsQuery.isPending;

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admin/lessons">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">New Lesson</h1>
					<p className="text-muted-foreground">
						Create a new lesson within a section
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
				<div className="grid gap-6 lg:grid-cols-3">
					{/* Main content */}
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Lesson Content</CardTitle>
								<CardDescription>
									Write the main content for this lesson
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
												rows={15}
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
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Settings</CardTitle>
								<CardDescription>Configure lesson settings</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<form.Field name="sectionId">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="sectionId">Section *</Label>
											<Select
												value={field.state.value}
												onValueChange={handleSectionChange}
											>
												<SelectTrigger id="sectionId">
													<SelectValue placeholder="Select a section" />
												</SelectTrigger>
												<SelectContent>
													{Array.from(subjectMap.entries()).map(
														([subjectId, subjectName]) => {
															const subjectChapters =
																chaptersBySubject.get(subjectId) ?? [];
															return (
																<div key={subjectId}>
																	<div className="px-2 py-1.5 font-bold text-muted-foreground text-xs">
																		{subjectName}
																	</div>
																	{subjectChapters.map((chapter) => {
																		const chapterSections =
																			sectionsByChapter.get(chapter._id) ?? [];
																		return (
																			<div key={chapter._id}>
																				<div className="px-4 py-1 font-semibold text-muted-foreground text-xs">
																					{chapter.name}
																				</div>
																				{chapterSections.map((section) => (
																					<SelectItem
																						key={section._id}
																						value={section._id}
																						className="pl-6"
																					>
																						{section.name}
																					</SelectItem>
																				))}
																			</div>
																		);
																	})}
																</div>
															);
														}
													)}
												</SelectContent>
											</Select>
											{field.state.meta.errors.length > 0 && (
												<p className="text-destructive text-sm">
													{field.state.meta.errors.join(', ')}
												</p>
											)}
										</div>
									)}
								</form.Field>

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
											{selectedSectionId && (
												<p className="text-muted-foreground text-xs">
													{lessonsInSection.length} lessons in selected section
												</p>
											)}
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

						<div className="flex gap-4">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								asChild
							>
								<Link to="/admin/lessons">
									Cancel
								</Link>
							</Button>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										className="flex-1"
										disabled={!canSubmit || isSubmitting}
									>
										{isSubmitting ? 'Creating...' : 'Create Lesson'}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
