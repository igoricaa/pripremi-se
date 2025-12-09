import { api } from '@pripremi-se/backend/convex/_generated/api';
import { createSectionSchema } from '@pripremi-se/shared';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { useQueryWithStatus } from '@/lib/convex';

export const Route = createFileRoute('/admin/sections/new')({
	component: NewSectionPage,
});

function NewSectionPage() {
	const navigate = useNavigate();
	const createSection = useMutation(api.sections.createSection);
	const subjectsQuery = useQueryWithStatus(api.subjects.listSubjects);
	const chaptersQuery = useQueryWithStatus(api.chapters.listChapters);
	const sectionsQuery = useQueryWithStatus(api.sections.listSections);

	const form = useForm({
		defaultValues: {
			chapterId: '',
			name: '',
			description: '',
			order: 0,
			isActive: false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = createSectionSchema.parse({
					chapterId: value.chapterId,
					name: value.name,
					description: value.description || undefined,
					slug: undefined, // Always auto-generated
					order: value.order,
					isActive: value.isActive,
				});

				await createSection(data);
				toast.success('Section created successfully');
				navigate({ to: '/admin/sections' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to create section'
				);
			}
		},
	});

	// Calculate sections in selected chapter for order hint
	const selectedChapterId = form.state.values.chapterId;
	const sectionsInChapter =
		sectionsQuery.data?.filter((s) => s.chapterId === selectedChapterId) ?? [];

	// When chapter changes, update the order to be the next available
	const handleChapterChange = (chapterId: string) => {
		form.setFieldValue('chapterId', chapterId);
		const sectionsInNewChapter =
			sectionsQuery.data?.filter((s) => s.chapterId === chapterId) ?? [];
		form.setFieldValue('order', sectionsInNewChapter.length);
	};

	// Group chapters by subject
	const subjectMap = new Map(
		subjectsQuery.data?.map((s) => [s._id as string, s.name]) ?? []
	);
	const chaptersBySubject = new Map<
		string,
		NonNullable<typeof chaptersQuery.data>
	>();
	for (const chapter of chaptersQuery.data ?? []) {
		const subjectId = chapter.subjectId as string;
		if (!chaptersBySubject.has(subjectId)) {
			chaptersBySubject.set(subjectId, []);
		}
		chaptersBySubject.get(subjectId)?.push(chapter);
	}

	const isPending = subjectsQuery.isPending || chaptersQuery.isPending;

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
				<Button asChild size="icon" variant="ghost">
					<Link to="/admin/sections">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">New Section</h1>
					<p className="text-muted-foreground">
						Create a new section within a chapter
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
							Enter the basic information for this section
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<form.Field name="chapterId">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="chapterId">Chapter *</Label>
									<Select
										onValueChange={handleChapterChange}
										value={field.state.value}
									>
										<SelectTrigger id="chapterId">
											<SelectValue placeholder="Select a chapter" />
										</SelectTrigger>
										<SelectContent>
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
									{field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-sm">
											{field.state.meta.errors.join(', ')}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="name">Name *</Label>
									<Input
										id="name"
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g., Linear Equations"
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
										placeholder="A brief description of this section..."
										rows={3}
										value={field.state.value}
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
										min={0}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(Number.parseInt(e.target.value) || 0)
										}
										type="number"
										value={field.state.value}
									/>
									{selectedChapterId && (
										<p className="text-muted-foreground text-xs">
											{sectionsInChapter.length} sections in selected chapter
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

				<div className="mt-6 flex justify-end gap-4">
					<Button asChild type="button" variant="outline">
						<Link to="/admin/sections">Cancel</Link>
					</Button>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button disabled={!canSubmit || isSubmitting} type="submit">
								{isSubmitting ? 'Creating...' : 'Create Section'}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}
