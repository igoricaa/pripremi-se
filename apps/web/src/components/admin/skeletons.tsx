import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StatsGridSkeleton() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<Card key={i}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-4" />
					</CardHeader>
					<CardContent>
						<Skeleton className="mb-1 h-8 w-16" />
						<Skeleton className="h-3 w-32" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
	return (
		<div className="space-y-3">
			<div className="flex gap-4 border-b pb-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-20" />
			</div>
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="flex gap-4 py-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-20" />
				</div>
			))}
		</div>
	);
}

export function PageSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48" />
			<TableSkeleton />
		</div>
	);
}
