import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useQueryWithStatus } from '@/lib/convex';
import { useForm } from '@tanstack/react-form';
import { createChapterSchema } from '@pripremi-se/shared';
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

export const Route = createFileRoute('/admin/chapters/new')({
	component: NewChapterPage,
});

function NewChapterPage() {
	const navigate = useNavigate();
	const createChapter = useMutation(api.chapters.createChapter);
	const subjectsQuery = useQueryWithStatus(api.subjects.listSubjects);
	const chaptersQuery = useQueryWithStatus(api.chapters.listChapters);

	const form = useForm({
		defaultValues: {
			subjectId: '',
			name: '',
			description: '',
			order: 0,
			isActive: false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = createChapterSchema.parse({
					subjectId: value.subjectId,
					name: value.name,
					description: value.description,
					slug: undefined, // Always auto-generated
					order: value.order,
					isActive: value.isActive,
				});

				await createChapter(data);
				toast.success('Chapter created successfully');
				navigate({ to: '/admin/chapters' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to create chapter'
				);
			}
		},
	});

	// Update default order when chapters load
	const selectedSubjectId = form.state.values.subjectId;
	const chaptersInSubject =
		chaptersQuery.data?.filter((ch) => ch.subjectId === selectedSubjectId) ??
		[];

	// When subject changes, update the order to be the next available
	const handleSubjectChange = (subjectId: string) => {
		form.setFieldValue('subjectId', subjectId);
		const chaptersInNewSubject =
			chaptersQuery.data?.filter((ch) => ch.subjectId === subjectId) ?? [];
		form.setFieldValue('order', chaptersInNewSubject.length);
	};

	if (subjectsQuery.isPending) {
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
					<Link to="/admin/chapters">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">New Chapter</h1>
					<p className="text-muted-foreground">
						Create a new chapter within a subject
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
							Enter the basic information for this chapter
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<form.Field name="subjectId">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="subjectId">Subject *</Label>
									<Select
										value={field.state.value}
										onValueChange={handleSubjectChange}
									>
										<SelectTrigger id="subjectId">
											<SelectValue placeholder="Select a subject" />
										</SelectTrigger>
										<SelectContent>
											{subjectsQuery.data?.map((subject) => (
												<SelectItem key={subject._id} value={subject._id}>
													{subject.name}
												</SelectItem>
											))}
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
										placeholder="e.g., Introduction to Algebra"
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
									<Label htmlFor="description">Description *</Label>
									<Textarea
										id="description"
										placeholder="A brief description of this chapter..."
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										rows={3}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-sm">
											{field.state.meta.errors.join(', ')}
										</p>
									)}
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
											field.handleChange(Number.parseInt(e.target.value) || 0)
										}
										onBlur={field.handleBlur}
									/>
									{selectedSubjectId && (
										<p className="text-muted-foreground text-xs">
											{chaptersInSubject.length} chapters in selected subject
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

				<div className="mt-6 flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						asChild
					>
						<Link to="/admin/chapters">
							Cancel
						</Link>
					</Button>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? 'Creating...' : 'Create Chapter'}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}
