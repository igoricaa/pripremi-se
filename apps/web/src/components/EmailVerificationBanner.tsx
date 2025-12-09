import { api } from '@pripremi-se/backend/convex/_generated/api';
import { AlertTriangle, Mail, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { useQueryWithStatus } from '@/lib/convex';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

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

export function EmailVerificationBanner() {
	const { data, isPending, isError } = useQueryWithStatus(
		api.users.getCurrentUser
	);
	const [dismissed, setDismissed] = useState(false);
	const [resending, setResending] = useState(false);
	const [cooldown, setCooldown] = useState(() => getRemainingCooldown());

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
		if (!data?.user.email || cooldown > 0) {
			return;
		}
		setResending(true);
		try {
			await authClient.sendVerificationEmail({
				email: data.user.email,
				callbackURL: '/email-verified',
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
			setResending(false);
		}
	};

	// Silent failure: don't show banner while loading, on error, or after verification/dismissal
	if (isPending || isError || !data || data.user.emailVerified || dismissed) {
		return null;
	}

	return (
		<Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
			<AlertTriangle className="h-4 w-4 text-amber-500" />
			<AlertTitle className="text-amber-700 dark:text-amber-400">
				Email not verified
			</AlertTitle>
			<AlertDescription className="flex items-center justify-between">
				<span className="text-amber-600 dark:text-amber-300">
					Please verify your email to access all features.
				</span>
				<div className="flex items-center gap-2">
					<Button
						className="border-amber-500/50 hover:bg-amber-500/10"
						disabled={resending || cooldown > 0}
						onClick={handleResendVerification}
						size="sm"
						variant="outline"
					>
						{resending ? (
							<RefreshCw className="mr-2 h-3 w-3 animate-spin" />
						) : (
							<Mail className="mr-2 h-3 w-3" />
						)}
						{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
					</Button>
					<Button
						className="h-8 w-8 p-0"
						onClick={() => setDismissed(true)}
						size="sm"
						variant="ghost"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	);
}
