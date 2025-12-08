import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	DataTableSkeleton,
	SKELETON_PRESETS,
	col,
	type SkeletonColumnConfig,
	type SkeletonPreset,
} from '@/components/ui/data-table';

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

export function CardHeaderSkeleton({ filterWidth = 'w-[280px]' }: { filterWidth?: string }) {
	return (
		<CardHeader>
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="mt-1 h-4 w-24" />
				</div>
				<Skeleton className={`h-10 ${filterWidth}`} />
			</div>
		</CardHeader>
	);
}

interface CardWithTableSkeletonProps {
	rows?: number;
	filterWidth?: string;
	preset?: SkeletonPreset;
	columns?: SkeletonColumnConfig[];
}

export function CardWithTableSkeleton({
	rows = 5,
	filterWidth = 'w-[280px]',
	preset,
	columns,
}: CardWithTableSkeletonProps) {
	const skeletonColumns = preset
		? SKELETON_PRESETS[preset]
		: columns ?? [col('text'), col('text'), col('badge'), col('actions')];

	return (
		<Card>
			<CardHeaderSkeleton filterWidth={filterWidth} />
			<CardContent>
				<DataTableSkeleton columns={skeletonColumns} rows={rows} />
			</CardContent>
		</Card>
	);
}
