import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useForm } from '@tanstack/react-form';
import { createSubjectSchema } from '@pripremi-se/shared';
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
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/subjects/new')({
	component: NewSubjectPage,
});

function NewSubjectPage() {
	const navigate = useNavigate();
	const createSubject = useMutation(api.subjects.createSubject);
	const subjects = useQuery(api.subjects.listSubjects);

	const form = useForm({
		defaultValues: {
			name: '',
			description: '',
			icon: '',
			slug: '',
			order: subjects?.length ?? 0,
			isActive: false,
		},
		onSubmit: async ({ value }) => {
			try {
				const data = createSubjectSchema.parse({
					name: value.name,
					description: value.description || undefined,
					icon: value.icon || undefined,
					slug: value.slug || undefined,
					order: value.order,
					isActive: value.isActive,
				})

				await createSubject(data);
				toast.success('Subject created successfully');
				navigate({ to: '/admin/subjects' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to create subject'
				)
			}
		},
	})

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/subjects' })}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">New Subject</h1>
					<p className="text-muted-foreground">Create a new curriculum subject</p>
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
										id='name'
										placeholder="e.g., Mathematics"
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
										id='description'
										placeholder="A brief description of this subject..."
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										rows={3}
									/>
								</div>
							)}
						</form.Field>

						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="icon">
								{(field) => (
									<div className='space-y-2'>
										<Label htmlFor="icon">Icon (emoji)</Label>
										<Input
											id='icon'
											placeholder='e.g., emoji'
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="slug">
								{(field) => (
									<div className='space-y-2'>
										<Label htmlFor="slug">Slug (optional)</Label>
										<Input
											id='slug'
											placeholder="auto-generated from name"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										<p className="text-muted-foreground text-xs">
											Leave empty to auto-generate from name
										</p>
									</div>
								)}
							</form.Field>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="order">
								{(field) => (
									<div className='space-y-2'>
										<Label htmlFor="order">Display Order</Label>
										<Input
											id='order'
											type='number'
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

							<form.Field name="isActive">
								{(field) => (
									<div className='space-y-2'>
										<Label>Status</Label>
										<div className="flex items-center space-x-2 pt-2">
											<Switch
												id='isActive'
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
						</div>
					</CardContent>
				</Card>

				<div className="mt-6 flex justify-end gap-4">
					<Button
						type='button'
						variant='outline'
						onClick={() => navigate({ to: '/admin/subjects' })}
					>
						Cancel
					</Button>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? 'Creating...' : 'Create Subject'}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	)
}
