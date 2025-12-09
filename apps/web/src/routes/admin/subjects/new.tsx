import { api } from '@pripremi-se/backend/convex/_generated/api';
import { createSubjectSchema } from '@pripremi-se/shared';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useQueryWithStatus } from '@/lib/convex';

export const Route = createFileRoute('/admin/subjects/new')({
	component: NewSubjectPage,
});

function NewSubjectPage() {
	const navigate = useNavigate();
	const createSubject = useMutation(api.subjects.createSubject);
	const subjectsQuery = useQueryWithStatus(api.subjects.listSubjects);

	const form = useForm({
		defaultValues: {
			name: '',
			description: '',
			icon: '',
			order: subjectsQuery.data?.length ?? 0,
			isActive: false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = createSubjectSchema.parse({
					name: value.name,
					description: value.description || undefined,
					icon: value.icon || undefined,
					slug: undefined, // Always auto-generated
					order: value.order,
					isActive: value.isActive,
				});

				await createSubject(data);
				toast.success('Subject created successfully');
				navigate({ to: '/admin/subjects' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to create subject'
				);
			}
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link to="/admin/subjects">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">New Subject</h1>
					<p className="text-muted-foreground">
						Create a new curriculum subject
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
							Enter the basic information for this subject
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

				<div className="mt-6 flex justify-end gap-4">
					<Button asChild type="button" variant="outline">
						<Link to="/admin/subjects">Cancel</Link>
					</Button>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button disabled={!canSubmit || isSubmitting} type="submit">
								{isSubmitting ? 'Creating...' : 'Create Subject'}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}
