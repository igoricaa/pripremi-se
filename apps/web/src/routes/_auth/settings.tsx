import { api } from '@pripremi-se/backend/convex/_generated/api';
import {
	changeEmailSchema,
	changePasswordSchema,
	profileNameSchema,
	profileUpdateSchema,
} from '@pripremi-se/shared/validators';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Loader2,
	Mail,
	MapPin,
	Shield,
	User,
} from 'lucide-react';
import { Activity, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authClient } from '@/lib/auth-client';
import { useQueryWithStatus } from '@/lib/convex';

type SettingsTab = 'profile' | 'security' | 'danger';

export const Route = createFileRoute('/_auth/settings')({
	validateSearch: (search: Record<string, unknown>): { tab?: SettingsTab } => ({
		tab: (search.tab as SettingsTab) || undefined,
	}),
	component: SettingsPage,
});

function SettingsPage() {
	const { tab } = Route.useSearch();
	const navigate = useNavigate();

	const handleTabChange = (value: string) => {
		navigate({
			to: '/settings',
			search: value === 'profile' ? undefined : { tab: value as SettingsTab },
		});
	};

	return (
		<div className="container mx-auto max-w-4xl py-8">
			<h1 className="mb-6 font-bold text-2xl">Settings</h1>

			<Tabs onValueChange={handleTabChange} value={tab || 'profile'}>
				<TabsList className="mb-6">
					<TabsTrigger className="gap-2" value="profile">
						<User className="h-4 w-4" />
						Profile
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="security">
						<Shield className="h-4 w-4" />
						Security
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="danger">
						<AlertTriangle className="h-4 w-4" />
						Danger Zone
					</TabsTrigger>
				</TabsList>

				<Activity
					mode={(tab || 'profile') === 'profile' ? 'visible' : 'hidden'}
				>
					<ProfileTab />
				</Activity>

				<Activity mode={tab === 'security' ? 'visible' : 'hidden'}>
					<SecurityTab />
				</Activity>

				<Activity mode={tab === 'danger' ? 'visible' : 'hidden'}>
					<DangerTab />
				</Activity>
			</Tabs>
		</div>
	);
}

// ============ Profile Tab ============
// User type from Convex query
type UserData = NonNullable<typeof api.users.getCurrentUser._returnType>;

function ProfileTab() {
	const { data, isPending, isError, error } = useQueryWithStatus(
		api.users.getCurrentUser
	);

	if (isPending) {
		return <ProfileTabSkeleton />;
	}

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Failed to load profile</AlertTitle>
				<AlertDescription>{error.message}</AlertDescription>
			</Alert>
		);
	}

	if (!data) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Profile not found</AlertTitle>
				<AlertDescription>
					Unable to load your profile. Please try signing in again.
				</AlertDescription>
			</Alert>
		);
	}

	return <ProfileForms user={data.user} userProfile={data.userProfile} />;
}

const COOLDOWN_KEY = 'emailVerificationCooldown';
const COOLDOWN_DURATION = 60;

function getRemainingCooldown(): number {
	const stored = localStorage.getItem(COOLDOWN_KEY);
	if (!stored) {
		return 0;
	}
	const expiresAt = Number.parseInt(stored, 10);
	const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
	return remaining > 0 ? remaining : 0;
}

function setCooldownExpiry(): void {
	const expiresAt = Date.now() + COOLDOWN_DURATION * 1000;
	localStorage.setItem(COOLDOWN_KEY, expiresAt.toString());
}

function ProfileForms({
	user,
	userProfile,
}: {
	user: UserData['user'];
	userProfile: UserData['userProfile'];
}) {
	const [nameLoading, setNameLoading] = useState(false);
	const [emailLoading, setEmailLoading] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);
	const [profileLoading, setProfileLoading] = useState(false);
	const [cooldown, setCooldown] = useState(() => getRemainingCooldown());

	const updateProfile = useMutation(api.userProfiles.updateMyProfile);

	useEffect(() => {
		if (cooldown <= 0) {
			return;
		}
		const timer = setInterval(() => {
			setCooldown((c) => (c > 0 ? c - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [cooldown]);

	const handleResendVerification = async () => {
		if (cooldown > 0) {
			return;
		}
		setResendLoading(true);
		try {
			await authClient.sendVerificationEmail({
				email: user.email,
				callbackURL: '/settings',
			});
			toast.success('Verification email sent!');
			setCooldownExpiry();
			setCooldown(COOLDOWN_DURATION);
		} catch (error) {
			const isRateLimited =
				error instanceof Error &&
				(error.message.toLowerCase().includes('rate') ||
					error.message.toLowerCase().includes('too many'));
			if (isRateLimited) {
				toast.error('Please wait before requesting another email');
				setCooldownExpiry();
				setCooldown(COOLDOWN_DURATION);
			} else {
				toast.error('Failed to send verification email');
			}
		} finally {
			setResendLoading(false);
		}
	};

	const nameForm = useForm({
		defaultValues: {
			name: user.name,
		},
		validators: { onSubmit: profileNameSchema },
		onSubmit: async ({ value }) => {
			setNameLoading(true);
			try {
				await authClient.updateUser({ name: value.name });
				toast.success('Profile updated!');
			} catch {
				toast.error('Failed to update profile');
			} finally {
				setNameLoading(false);
			}
		},
	});

	// Email form - starts empty (which is correct behavior)
	const emailForm = useForm({
		defaultValues: {
			newEmail: '',
		},
		validators: { onSubmit: changeEmailSchema },
		onSubmit: async ({ value }) => {
			if (value.newEmail === user.email) {
				toast.error('New email must be different from current email');
				return;
			}
			setEmailLoading(true);
			try {
				await authClient.changeEmail({
					newEmail: value.newEmail,
					callbackURL: '/settings',
				});
				toast.success('Verification email sent to your new address!');
				emailForm.reset();
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : 'Failed to change email';
				toast.error(message);
			} finally {
				setEmailLoading(false);
			}
		},
	});

	// Profile details form
	const profileForm = useForm({
		defaultValues: {
			displayName: userProfile?.displayName ?? user.name,
			location: userProfile?.location ?? '',
		},
		validators: { onSubmit: profileUpdateSchema },
		onSubmit: async ({ value }) => {
			setProfileLoading(true);
			try {
				await updateProfile({
					displayName: value.displayName,
					location: value.location || '',
				});
				toast.success('Profile details updated!');
			} catch (error: unknown) {
				const message =
					error instanceof Error
						? error.message
						: 'Failed to update profile details';
				toast.error(message);
			} finally {
				setProfileLoading(false);
			}
		},
	});

	return (
		<div className="space-y-6">
			{/* Profile Information Card */}
			<Card>
				<CardHeader>
					<CardTitle>Profile Information</CardTitle>
					<CardDescription>Update your display name</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							nameForm.handleSubmit();
						}}
					>
						<FieldGroup>
							<nameForm.Field name="name">
								{(field) => (
									<Field>
										<FieldLabel>Name</FieldLabel>
										<Input
											onChange={(e) => field.handleChange(e.target.value)}
											value={field.state.value}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</nameForm.Field>
						</FieldGroup>

						<nameForm.Subscribe selector={(state) => state.isDefaultValue}>
							{(isDefaultValue) => (
								<Button
									className="mt-4"
									disabled={nameLoading || isDefaultValue}
									type="submit"
								>
									{nameLoading && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save changes
								</Button>
							)}
						</nameForm.Subscribe>
					</form>
				</CardContent>
			</Card>

			{/* Email Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						Email Address
					</CardTitle>
					<CardDescription>
						Manage your email address and verification status
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Current Email */}
					<div className="space-y-2">
						<Label className="font-medium text-sm">Current Email</Label>
						<div className="flex items-center gap-3">
							<Input className="flex-1" disabled value={user.email} />
							{user.emailVerified ? (
								<span className="flex items-center gap-1 text-green-600 text-sm">
									<CheckCircle2 className="h-4 w-4" />
									Verified
								</span>
							) : (
								<div className="flex items-center gap-2">
									<span className="flex items-center gap-1 text-amber-600 text-sm">
										<Clock className="h-4 w-4" />
										Not verified
									</span>
									<Button
										disabled={resendLoading || cooldown > 0}
										onClick={handleResendVerification}
										size="sm"
										variant="outline"
									>
										{resendLoading ? (
											<Loader2 className="mr-1 h-3 w-3 animate-spin" />
										) : (
											<Mail className="mr-1 h-3 w-3" />
										)}
										{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* Change Email Form */}
					<div className="border-t pt-6">
						<h4 className="mb-4 font-medium text-sm">Change Email Address</h4>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								emailForm.handleSubmit();
							}}
						>
							<FieldGroup>
								<emailForm.Field name="newEmail">
									{(field) => (
										<Field>
											<FieldLabel>New Email Address</FieldLabel>
											<Input
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Enter new email address"
												type="email"
												value={field.state.value}
											/>
											<FieldError errors={field.state.meta.errors} />
											<p className="text-muted-foreground text-xs">
												A verification email will be sent to your new address
											</p>
										</Field>
									)}
								</emailForm.Field>
							</FieldGroup>

							<emailForm.Subscribe selector={(state) => state.isDefaultValue}>
								{(isDefaultValue) => (
									<Button
										className="mt-4"
										disabled={emailLoading || isDefaultValue}
										type="submit"
									>
										{emailLoading && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Change Email
									</Button>
								)}
							</emailForm.Subscribe>
						</form>
					</div>
				</CardContent>
			</Card>

			{/* Profile Details Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MapPin className="h-5 w-5" />
						Profile Details
					</CardTitle>
					<CardDescription>
						Additional profile information visible to others
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							profileForm.handleSubmit();
						}}
					>
						<FieldGroup>
							<profileForm.Field name="displayName">
								{(field) => (
									<Field>
										<FieldLabel>Display Name</FieldLabel>
										<Input
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="How you want to be called"
											value={field.state.value}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</profileForm.Field>

							<profileForm.Field name="location">
								{(field) => (
									<Field>
										<FieldLabel>Location</FieldLabel>
										<Input
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="City, Country (optional)"
											value={field.state.value}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</profileForm.Field>
						</FieldGroup>

						<profileForm.Subscribe selector={(state) => state.isDefaultValue}>
							{(isDefaultValue) => (
								<Button
									className="mt-4"
									disabled={profileLoading || isDefaultValue}
									type="submit"
								>
									{profileLoading && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save Profile Details
								</Button>
							)}
						</profileForm.Subscribe>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

function ProfileTabSkeleton() {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="mt-2 h-4 w-60" />
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-28" />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="mt-2 h-4 w-72" />
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ============ Security Tab ============
function SecurityTab() {
	const [loading, setLoading] = useState(false);

	const form = useForm({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
		validators: { onSubmit: changePasswordSchema },
		onSubmit: async ({ value }) => {
			setLoading(true);
			try {
				await authClient.changePassword({
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
					revokeOtherSessions: true,
				});
				toast.success('Password changed successfully!');
				form.reset();
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : 'Failed to change password';
				toast.error(message);
			} finally {
				setLoading(false);
			}
		},
	});

	return (
		<div className="space-y-6">
			{/* Change Password Card */}
			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>
						Update your password to keep your account secure
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field name="currentPassword">
								{(field) => (
									<Field>
										<FieldLabel>Current Password</FieldLabel>
										<Input
											autoComplete="current-password"
											onChange={(e) => field.handleChange(e.target.value)}
											type="password"
											value={field.state.value}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>

							<form.Field name="newPassword">
								{(field) => (
									<Field>
										<FieldLabel>New Password</FieldLabel>
										<Input
											autoComplete="new-password"
											onChange={(e) => field.handleChange(e.target.value)}
											type="password"
											value={field.state.value}
										/>
										<FieldError errors={field.state.meta.errors} />
										<p className="text-muted-foreground text-xs">
											Must be at least 8 characters with uppercase, lowercase,
											and a number
										</p>
									</Field>
								)}
							</form.Field>

							<form.Field name="confirmPassword">
								{(field) => (
									<Field>
										<FieldLabel>Confirm New Password</FieldLabel>
										<Input
											autoComplete="new-password"
											onChange={(e) => field.handleChange(e.target.value)}
											type="password"
											value={field.state.value}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
						</FieldGroup>

						<div className="mt-4 flex items-center gap-4">
							<form.Subscribe selector={(state) => state.isDefaultValue}>
								{(isDefaultValue) => (
									<Button disabled={loading || isDefaultValue} type="submit">
										{loading && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Change Password
									</Button>
								)}
							</form.Subscribe>
							<p className="text-muted-foreground text-xs">
								All other sessions will be signed out
							</p>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

// ============ Danger Tab ============
function DangerTab() {
	const navigate = useNavigate();
	const [password, setPassword] = useState('');
	const [confirmText, setConfirmText] = useState('');
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);

	const canDelete = confirmText === 'DELETE' && password.length > 0;

	const handleDeleteAccount = async () => {
		if (!canDelete) {
			return;
		}

		setLoading(true);
		try {
			await authClient.deleteUser({ password });
			toast.success('Account deleted');
			navigate({ to: '/' });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Failed to delete account';
			toast.error(message);
			setLoading(false);
		}
	};

	const resetForm = () => {
		setPassword('');
		setConfirmText('');
	};

	return (
		<Card className="border-destructive">
			<CardHeader>
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Danger Zone</AlertTitle>
					<AlertDescription>
						Actions in this section are irreversible. Please proceed with
						caution.
					</AlertDescription>
				</Alert>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<h3 className="font-semibold">Delete Account</h3>
					<p className="text-muted-foreground text-sm">
						Permanently delete your account and all associated data. This action
						cannot be undone.
					</p>
				</div>

				<AlertDialog
					onOpenChange={(open) => {
						setDialogOpen(open);
						if (!open) {
							resetForm();
						}
					}}
					open={dialogOpen}
				>
					<AlertDialogTrigger asChild>
						<Button variant="destructive">Delete Account</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete your
								account and remove all your data from our servers.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label
									className="font-medium text-sm"
									htmlFor="delete-password"
								>
									Enter your password
								</Label>
								<Input
									id="delete-password"
									name="password"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Your password"
									type="password"
									value={password}
								/>
							</div>

							<div className="space-y-2">
								<Label className="font-medium text-sm" htmlFor="delete-confirm">
									Type <span className="font-mono font-bold">DELETE</span> to
									confirm
								</Label>
								<Input
									id="delete-confirm"
									name="confirm"
									onChange={(e) => setConfirmText(e.target.value)}
									placeholder="DELETE"
									value={confirmText}
								/>
							</div>
						</div>

						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								disabled={loading || !canDelete}
								onClick={(e) => {
									e.preventDefault();
									handleDeleteAccount();
								}}
							>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Delete Account Permanently
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
