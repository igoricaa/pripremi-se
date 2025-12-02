import { SignInFormValues, signInSchema } from '@pripremi-se/shared/validators';
import { useForm } from '@tanstack/react-form';
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from '@tanstack/react-router';
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

export const Route = createFileRoute('/sign-in/')({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		if (context.userId) {
			throw redirect({ to: '/dashboard' });
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
		validators: {
			onSubmit: signInSchema,
		},
		onSubmit: ({ value }) => {
			onSubmit(value);
		},
	});

	const clearAuthErrors = () => {
		if (formError) {
			setFormError(null);
			form.setFieldMeta('email', (prev) => ({
				...prev,
				errorMap: {},
			}));
			form.setFieldMeta('password', (prev) => ({
				...prev,
				errorMap: {},
			}));
		}
	};

	const onSubmit = async (data: SignInFormValues) => {
		await authClient.signIn.email(
			{
				email: data.email,
				password: data.password,
			},
			{
				onRequest: () => {
					setLoading(true);
				},
				onSuccess: () => {
					setLoading(false);
					navigate({ to: '/dashboard' });
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
													onChange={(e) => {
														clearAuthErrors();
														field.handleChange(e.target.value);
													}}
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
													onChange={(e) => {
														clearAuthErrors();
														field.handleChange(e.target.value);
													}}
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
									'Sign in'
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
				<p className="text-center mt-4 text-sm text-neutral-600 dark:text-neutral-400">
					Don&apos;t have an account?{' '}
					<Link
						className="text-orange-400 hover:text-orange-500 dark:text-orange-300 dark:hover:text-orange-200 underline"
						to="/sign-up"
					>
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
