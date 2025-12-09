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
import { getChapterColumns } from './columns';

export const Route = createFileRoute('/admin/chapters/')({
	loader: async ({ context }) => {
		if (typeof window === 'undefined' || !context.userId) {
			return;
		}

		context.queryClient.prefetchQuery(
			convexQuery(api.chapters.listChaptersWithSubjects, {})
		);
	},
	component: ChaptersPage,
});

function ChaptersPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteChapter = useMutation(
		api.chapters.deleteChapter
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(
			api.chapters.listChaptersWithSubjects,
			{}
		);
		if (current === undefined) return;
		const updated = {
			...current,
			chapters: current.chapters.filter((item) => item._id !== args.id),
		};
		localStore.setQuery(api.chapters.listChaptersWithSubjects, {}, updated);
		toast.success('Chapter deleted successfully');
	});

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteChapter({ id: idToDelete });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete chapter'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Chapters</h1>
					<p className="text-muted-foreground">Manage curriculum chapters</p>
				</div>
				<Button asChild>
					<Link to="/admin/chapters/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Chapter
					</Link>
				</Button>
			</div>

			<Suspense
				fallback={
					<CardWithTableSkeleton
						filterWidth="w-[200px]"
						preset="chapters"
						rows={20}
					/>
				}
			>
				<ChaptersCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			<DeleteConfirmDialog
				description={DELETE_MESSAGES.chapter.description}
				onConfirm={handleDelete}
				onOpenChange={() => setDeleteId(null)}
				open={!!deleteId}
				title={DELETE_MESSAGES.chapter.title}
			/>
		</div>
	);
}

function ChaptersCard({
	onDeleteRequest,
}: {
	onDeleteRequest: (id: string) => void;
}) {
	const { data } = useSuspenseQuery(
		convexQuery(api.chapters.listChaptersWithSubjects, {})
	);

	const reorderChapters = useMutation(
		api.chapters.reorderChapters
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(
			api.chapters.listChaptersWithSubjects,
			{}
		);
		if (current === undefined) return;

		const orderMap = new Map(args.items.map((item) => [item.id, item.order]));
		const updated = {
			...current,
			chapters: current.chapters
				.map((chapter) => ({
					...chapter,
					order: orderMap.get(chapter._id) ?? chapter.order,
				}))
				.sort((a, b) => {
					// Sort by (subjectId, order) to match backend
					if (a.subjectId !== b.subjectId) {
						return a.subjectId.localeCompare(b.subjectId);
					}
					return a.order - b.order;
				}),
		};

		localStore.setQuery(api.chapters.listChaptersWithSubjects, {}, updated);
	});

	const { chapters, subjects } = data;

	// Use hierarchy filter state hook
	const filterState = useHierarchyFilterState({ levels: ['subject'] });
	const [searchTerm, setSearchTerm] = useState('');

	const filteredChapters = chapters.filter((ch) => {
		if (filterState.subjectId && ch.subjectId !== filterState.subjectId) {
			return false;
		}
		if (
			searchTerm &&
			!ch.name.toLowerCase().includes(searchTerm.toLowerCase())
		) {
			return false;
		}
		return true;
	});

	const hasActiveFilters = filterState.hasActiveFilters || searchTerm;

	const clearAllFilters = () => {
		filterState.clearAll();
		setSearchTerm('');
	};

	const subjectMap = new Map(subjects.map((s) => [s._id, s.name]));

	// Enable drag-and-drop when a specific subject is selected OR only one subject exists
	const sortableEnabled = !!filterState.subjectId || subjects.length === 1;

	const columns = getChapterColumns({
		subjectMap,
		onDelete: onDeleteRequest,
		sortableEnabled,
	});

	const handleReorder = async (items: Array<{ id: string; order: number }>) => {
		try {
			await reorderChapters({ items });
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
							<CardTitle>All Chapters</CardTitle>
							<CardDescription>
								{filteredChapters.length} chapter
								{filteredChapters.length !== 1 ? 's' : ''}
								{searchTerm && ' matching search'}
								{filterState.subjectId && !searchTerm && ' in selected subject'}
								{!(searchTerm || filterState.subjectId) && ' total'}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<HierarchyFilterBar
								chapters={[]}
								comboboxWidth="w-[200px]"
								levels={['subject']}
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
						placeholder="Search chapters..."
						value={searchTerm}
					/>
				</div>
			</CardHeader>
			<CardContent>
				<SortableDataTable
					columns={columns}
					data={filteredChapters}
					defaultPageSize={20}
					onReorder={handleReorder}
					sortableEnabled={sortableEnabled}
				/>
			</CardContent>
		</Card>
	);
}
