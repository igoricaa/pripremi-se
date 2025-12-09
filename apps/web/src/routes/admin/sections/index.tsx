import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { Plus, X } from 'lucide-react';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { HierarchyFilterBar } from '@/components/admin/HierarchyFilterBar';
import { CardWithTableSkeleton } from '@/components/admin/skeletons';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { SortableDataTable } from '@/components/ui/data-table/sortable-data-table';
import { SearchInput } from '@/components/ui/search-input';
import { useHierarchyFilterState } from '@/hooks/use-hierarchy-filter-state';
import { DELETE_MESSAGES } from '@/lib/constants/admin-ui';
import { convexQuery } from '@/lib/convex';
import { getSectionColumns } from './columns';

export const Route = createFileRoute('/admin/sections/')({
	loader: async ({ context }) => {
		if (typeof window === 'undefined') return;

		context.queryClient.prefetchQuery(
			convexQuery(api.sections.listSectionsWithHierarchy, {})
		);
	},
	component: SectionsPage,
});

function SectionsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteSection = useMutation(
		api.sections.deleteSection
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(
			api.sections.listSectionsWithHierarchy,
			{}
		);
		if (current === undefined) return;
		const updated = {
			...current,
			sections: current.sections.filter((item) => item._id !== args.id),
		};
		localStore.setQuery(api.sections.listSectionsWithHierarchy, {}, updated);
		toast.success('Section deleted successfully');
	});

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteSection({ id: idToDelete });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete section'
			);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header renders immediately - no data needed */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sections</h1>
					<p className="text-muted-foreground">Manage curriculum sections</p>
				</div>
				<Button asChild>
					<Link to="/admin/sections/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Section
					</Link>
				</Button>
			</div>

			{/* Data component suspends until ready */}
			<Suspense
				fallback={
					<CardWithTableSkeleton
						filterWidth="w-[340px]"
						preset="sections"
						rows={20}
					/>
				}
			>
				<SectionsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			{/* Delete dialog - always available */}
			<DeleteConfirmDialog
				description={DELETE_MESSAGES.section.description}
				onConfirm={handleDelete}
				onOpenChange={() => setDeleteId(null)}
				open={!!deleteId}
				title={DELETE_MESSAGES.section.title}
			/>
		</div>
	);
}

function SectionsCard({
	onDeleteRequest,
}: {
	onDeleteRequest: (id: string) => void;
}) {
	// Single query - data already prefetched by loader
	const { data } = useSuspenseQuery(
		convexQuery(api.sections.listSectionsWithHierarchy, {})
	);

	const reorderSections = useMutation(
		api.sections.reorderSections
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(
			api.sections.listSectionsWithHierarchy,
			{}
		);
		if (current === undefined) return;

		const orderMap = new Map(args.items.map((item) => [item.id, item.order]));
		const updated = {
			...current,
			sections: current.sections
				.map((section) => ({
					...section,
					order: orderMap.get(section._id) ?? section.order,
				}))
				.sort((a, b) => {
					// Sort by (chapterId, order) to match backend
					if (a.chapterId !== b.chapterId) {
						return a.chapterId.localeCompare(b.chapterId);
					}
					return a.order - b.order;
				}),
		};

		localStore.setQuery(api.sections.listSectionsWithHierarchy, {}, updated);
	});

	const { sections, hierarchy } = data;
	const { subjects, chapters } = hierarchy;

	// Use hierarchy filter state hook
	const filterState = useHierarchyFilterState({
		levels: ['subject', 'chapter'],
	});
	const [searchTerm, setSearchTerm] = useState('');

	// Create lookup map for table rendering
	const chapterMap = new Map(chapters.map((c) => [c._id, c]));

	// Chapters available based on selected subject (for sortable logic)
	const availableChapters = filterState.subjectId
		? chapters.filter((c) => c.subjectId === filterState.subjectId)
		: chapters;

	// Filter sections based on all selected levels and search
	const filteredSections = (() => {
		let result = sections;

		if (filterState.chapterId) {
			result = result.filter((s) => s.chapterId === filterState.chapterId);
		} else if (filterState.subjectId) {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === filterState.subjectId)
					.map((c) => c._id)
			);
			result = result.filter((s) => chapterIds.has(s.chapterId));
		}

		if (searchTerm) {
			result = result.filter((s) =>
				s.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return result;
	})();

	const hasActiveFilters = filterState.hasActiveFilters || searchTerm;

	const clearAllFilters = () => {
		filterState.clearAll();
		setSearchTerm('');
	};

	// Determine description text
	const filterDescription = searchTerm
		? 'matching search'
		: filterState.chapterId
			? 'in selected chapter'
			: filterState.subjectId
				? 'in selected subject'
				: 'total';

	// Enable drag-and-drop when a specific chapter is selected OR only one chapter available
	const sortableEnabled =
		!!filterState.chapterId || availableChapters.length === 1;

	const columns = getSectionColumns({
		chapterMap,
		onDelete: onDeleteRequest,
		sortableEnabled,
	});

	const handleReorder = async (items: Array<{ id: string; order: number }>) => {
		try {
			await reorderSections({ items });
			toast.success('Order updated');
		} catch {
			toast.error('Failed to update order');
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>All Sections</CardTitle>
							<CardDescription>
								{filteredSections.length} section
								{filteredSections.length !== 1 ? 's' : ''} {filterDescription}
							</CardDescription>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<HierarchyFilterBar
								chapters={chapters}
								levels={['subject', 'chapter']}
								state={filterState}
								subjects={subjects}
							/>
							{hasActiveFilters && (
								<Button onClick={clearAllFilters} size="sm" variant="outline">
									<X className="mr-2 h-4 w-4" />
									Clear
								</Button>
							)}
						</div>
					</div>

					<SearchInput
						className="max-w-sm"
						onChange={setSearchTerm}
						placeholder="Search sections..."
						value={searchTerm}
					/>
				</div>
			</CardHeader>
			<CardContent>
				<SortableDataTable
					columns={columns}
					data={filteredSections}
					defaultPageSize={20}
					onReorder={handleReorder}
					sortableEnabled={sortableEnabled}
				/>
			</CardContent>
		</Card>
	);
}
