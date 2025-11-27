import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-error-messages';
import { SignUpFormValues, signUpSchema } from '@/lib/validations/user-schemas';

export const Route = createFileRoute('/sign-up/')({
	component: RouteComponent,
});

function RouteComponent() {
	const [loading, setLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			password: '',
			passwordConfirmation: '',
		},
		validators: {
			onSubmit: signUpSchema,
		},
		onSubmit: ({ value }) => {
			onSubmit(value);
		},
	});

	const onSubmit = async (data: SignUpFormValues) => {
		await authClient.signUp.email(
			{
				name: `${data.firstName} ${data.lastName}`,
				email: data.email,
				password: data.password,
			},
			{
				onRequest: () => {
					setLoading(true);
				},
				onSuccess: () => {
					setLoading(false);
					navigate({ to: '/sign-in' });
				},
				onError: (ctx) => {
					setLoading(false);

					const { message, showFieldErrors, fieldMessage } =
						getAuthErrorMessage(ctx.error.status, ctx.error.message);

					setFormError(message);

					// Show visual feedback on form fields for auth failures
					if (showFieldErrors && fieldMessage) {
						form.setFieldMeta('email', (prev) => ({
							...prev,
							errorMap: { onSubmit: fieldMessage },
						}));
						form.setFieldMeta('password', (prev) => ({
							...prev,
							errorMap: { onSubmit: fieldMessage },
						}));
					}
				},
			}
		);
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
						<CardDescription className="text-xs md:text-sm">
							Enter your email below to login to your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							// id="sign-in-form"
							className="grid gap-4"
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
						>
							{formError && (
								<div
									className="rounded-md bg-red-500/80 px-4 py-3 text-sm text-white"
									role="alert"
								>
									{formError}
								</div>
							)}
							<FieldGroup>
								<form.Field name="firstName">
									{(field) => {
										const hasErrors = field.state.meta.errors.length > 0;
										const isInvalid =
											(field.state.meta.isTouched &&
												!field.state.meta.isValid) ||
											hasErrors;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>First Name</FieldLabel>
												<Input
													aria-invalid={isInvalid}
													autoComplete="off"
													id={field.name}
													name={field.name}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
								<form.Field name="lastName">
									{(field) => {
										const hasErrors = field.state.meta.errors.length > 0;
										const isInvalid =
											(field.state.meta.isTouched &&
												!field.state.meta.isValid) ||
											hasErrors;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
												<Input
													aria-invalid={isInvalid}
													autoComplete="off"
													id={field.name}
													name={field.name}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
								<form.Field name="email">
									{(field) => {
										const hasErrors = field.state.meta.errors.length > 0;
										const isInvalid =
											(field.state.meta.isTouched &&
												!field.state.meta.isValid) ||
											hasErrors;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Email</FieldLabel>
												<Input
													aria-invalid={isInvalid}
													autoComplete="off"
													id={field.name}
													name={field.name}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="m@example.com"
													value={field.state.value}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
								<form.Field name="password">
									{(field) => {
										const hasErrors = field.state.meta.errors.length > 0;
										const isInvalid =
											(field.state.meta.isTouched &&
												!field.state.meta.isValid) ||
											hasErrors;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Password</FieldLabel>
												<Input
													aria-invalid={isInvalid}
													autoComplete="current-password"
													id={field.name}
													name={field.name}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="password"
													type="password"
													value={field.state.value}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
								<form.Field name="passwordConfirmation">
									{(field) => {
										const hasErrors = field.state.meta.errors.length > 0;
										const isInvalid =
											(field.state.meta.isTouched &&
												!field.state.meta.isValid) ||
											hasErrors;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Password Confirmation
												</FieldLabel>
												<Input
													aria-invalid={isInvalid}
													autoComplete="off"
													id={field.name}
													name={field.name}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="password"
													type="password"
													value={field.state.value}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
							</FieldGroup>

							<Button className="w-full" disabled={loading} type="submit">
								{loading ? (
									<Loader2 className="animate-spin" size={16} />
								) : (
									'Sign up'
								)}
							</Button>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-neutral-800" />
								</div>
								<div className="relative flex justify-center text-xs">
									<span className="bg-card px-2 text-neutral-500">
										or continue with
									</span>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
