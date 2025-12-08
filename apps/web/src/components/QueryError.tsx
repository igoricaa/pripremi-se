import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface QueryErrorProps {
	error: Error;
	title?: string;
	onRetry?: () => void;
	className?: string;
}

/**
 * Displays a user-friendly error message for failed Convex queries.
 *
 * @example
 * ```tsx
 * const { data, isError, error } = useQueryWithStatus(api.users.list);
 * if (isError) return <QueryError error={error} title="Failed to load users" />;
 * ```
 */
export function QueryError({
	error,
	title = 'Something went wrong',
	onRetry,
	className,
}: QueryErrorProps) {
	return (
		<Alert variant="destructive" className={className}>
			<AlertTriangle className="h-4 w-4" />
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription className="flex items-center justify-between">
				<span>{error.message || 'An unexpected error occurred'}</span>
				{onRetry && (
					<Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
						<RefreshCw className="mr-2 h-3 w-3" />
						Retry
					</Button>
				)}
			</AlertDescription>
		</Alert>
	);
}