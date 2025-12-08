import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

// Column type definitions for skeleton rendering
type SkeletonColumnType =
	| "drag" // GripVertical icon placeholder
	| "text" // Standard text
	| "text-truncated" // Long text with max-w-md
	| "text-muted" // Muted/secondary text
	| "text-code" // Monospace text (slugs)
	| "text-stacked" // Two lines stacked
	| "badge" // Status badge (pill shape)
	| "badge-outline" // Outline badge variant
	| "number" // Short numeric value
	| "icon-text" // Icon + text combo
	| "actions" // Edit/Delete buttons
	| "checkbox" // Checkbox column

interface SkeletonColumnConfig {
	type: SkeletonColumnType
	width?: string // Override default width
}

interface DataTableSkeletonProps {
	columns: SkeletonColumnConfig[]
	rows?: number
	showPagination?: boolean
}

// Default widths and header widths by column type
const COLUMN_DEFAULTS: Record<
	SkeletonColumnType,
	{ width: string; headerWidth: string }
> = {
	drag: { width: "w-4", headerWidth: "w-0" },
	text: { width: "w-32", headerWidth: "w-20" },
	"text-truncated": { width: "w-48", headerWidth: "w-24" },
	"text-muted": { width: "w-28", headerWidth: "w-20" },
	"text-code": { width: "w-24", headerWidth: "w-16" },
	"text-stacked": { width: "w-32", headerWidth: "w-24" },
	badge: { width: "w-16", headerWidth: "w-16" },
	"badge-outline": { width: "w-20", headerWidth: "w-12" },
	number: { width: "w-12", headerWidth: "w-16" },
	"icon-text": { width: "w-24", headerWidth: "w-20" },
	actions: { width: "w-20", headerWidth: "w-0" },
	checkbox: { width: "w-4", headerWidth: "w-4" },
}

// Helper for concise column definitions
export function col(
	type: SkeletonColumnType,
	width?: string
): SkeletonColumnConfig {
	return width ? { type, width } : { type }
}

// Renders skeleton based on column type
function SkeletonCell({ config }: { config: SkeletonColumnConfig }) {
	const defaults = COLUMN_DEFAULTS[config.type]
	const width = config.width ?? defaults.width

	switch (config.type) {
		case "drag":
			return <Skeleton className="h-4 w-4" />

		case "text":
		case "text-muted":
		case "text-code":
			return <Skeleton className={cn("h-4", width)} />

		case "text-truncated":
			return (
				<div className="flex max-w-md items-start gap-2">
					<Skeleton className={cn("h-4", width)} />
				</div>
			)

		case "text-stacked":
			return (
				<div className="flex flex-col gap-1">
					<Skeleton className="h-3 w-16" />
					<Skeleton className={cn("h-4", width)} />
				</div>
			)

		case "badge":
		case "badge-outline":
			return <Skeleton className={cn("h-5 rounded-full", width)} />

		case "number":
			return <Skeleton className={cn("h-4", width)} />

		case "icon-text":
			return (
				<div className="flex items-center gap-1.5">
					<Skeleton className="h-4 w-4" />
					<Skeleton className="h-4 w-16" />
				</div>
			)

		case "actions":
			return (
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-8 rounded-md" />
					<Skeleton className="h-8 w-8 rounded-md" />
				</div>
			)

		case "checkbox":
			return <Skeleton className="h-4 w-4" />

		default:
			return <Skeleton className="h-4 w-24" />
	}
}

// Pagination skeleton matching DataTablePagination layout
function DataTablePaginationSkeleton() {
	return (
		<div className="flex items-center justify-between px-2">
			{/* Left: Row count */}
			<Skeleton className="h-4 w-24" />

			<div className="flex items-center space-x-6 lg:space-x-8">
				{/* Rows per page */}
				<div className="flex items-center space-x-2">
					<Skeleton className="h-4 w-[86px]" />
					<Skeleton className="h-8 w-[70px] rounded-md" />
				</div>

				{/* Page indicator */}
				<div className="flex w-[140px] items-center justify-center">
					<Skeleton className="h-4 w-24" />
				</div>

				{/* Navigation buttons */}
				<div className="flex items-center space-x-2">
					<Skeleton className="h-9 w-9 rounded-md" />
					<Skeleton className="h-9 w-9 rounded-md" />
					<Skeleton className="h-9 w-9 rounded-md" />
					<Skeleton className="h-9 w-9 rounded-md" />
				</div>
			</div>
		</div>
	)
}

// Main skeleton component
export function DataTableSkeleton({
	columns,
	rows = 5,
	showPagination = true,
}: DataTableSkeletonProps) {
	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((config, i) => {
								const defaults = COLUMN_DEFAULTS[config.type]
								const headerWidth = defaults.headerWidth
								return (
									<TableHead key={i}>
										{headerWidth !== "w-0" && (
											<Skeleton className={cn("h-4", headerWidth)} />
										)}
									</TableHead>
								)
							})}
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: rows }).map((_, rowIndex) => (
							<TableRow key={rowIndex}>
								{columns.map((config, colIndex) => (
									<TableCell key={colIndex}>
										<SkeletonCell config={config} />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{showPagination && <DataTablePaginationSkeleton />}
		</div>
	)
}

// Pre-defined skeleton configs for each admin page
export const SKELETON_PRESETS = {
	subjects: [
		col("drag"),
		col("text", "w-40"),
		col("text-code"),
		col("badge"),
		col("number"),
		col("actions"),
	],
	chapters: [
		col("drag"),
		col("text", "w-40"),
		col("text-muted"),
		col("text-code"),
		col("badge"),
		col("number"),
		col("actions"),
	],
	sections: [
		col("drag"),
		col("text", "w-40"),
		col("text-muted"),
		col("text-code"),
		col("badge"),
		col("number"),
		col("actions"),
	],
	lessons: [
		col("drag"),
		col("text", "w-40"),
		col("text-stacked"),
		col("icon-text"),
		col("text-muted", "w-16"),
		col("badge"),
		col("number"),
		col("actions"),
	],
	questions: [
		col("text-truncated", "w-64"), // text (truncated)
		col("badge-outline"), // type badge
		col("badge"), // difficulty badge
		col("number"), // points
		col("text-muted", "w-24"), // lessonTitle
		col("actions"),
	],
} as const satisfies Record<string, SkeletonColumnConfig[]>

export type SkeletonPreset = keyof typeof SKELETON_PRESETS
export type { SkeletonColumnConfig, SkeletonColumnType }
