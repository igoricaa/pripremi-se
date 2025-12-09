import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { Plus, X } from 'lucide-react';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { CardWithTableSkeleton } from '@/components/admin/skeletons';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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

	const { sections, hierarchy } = data;
	const { subjects, chapters } = hierarchy;

	// Filter states for cascading dropdowns
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
	const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
	const [searchTerm, setSearchTerm] = useState('');

	// Create lookup map for table rendering
	const chapterMap = new Map(chapters.map((c) => [c._id, c]));

	// Cascading reset handler
	const handleSubjectChange = (value: string) => {
		setSelectedSubjectId(value);
		setSelectedChapterId('all');
	};

	// Chapters available based on selected subject
	const availableChapters =
		selectedSubjectId === 'all'
			? chapters
			: chapters.filter((c) => c.subjectId === selectedSubjectId);

	// Filter sections based on all selected levels and search
	const filteredSections = (() => {
		let result = sections;

		if (selectedChapterId !== 'all') {
			result = result.filter((s) => s.chapterId === selectedChapterId);
		} else if (selectedSubjectId !== 'all') {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === selectedSubjectId)
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

	const hasActiveFilters =
		selectedSubjectId !== 'all' || selectedChapterId !== 'all' || searchTerm;

	const clearAllFilters = () => {
		setSelectedSubjectId('all');
		setSelectedChapterId('all');
		setSearchTerm('');
	};

	// Determine description text
	const filterDescription = searchTerm
		? 'matching search'
		: selectedChapterId !== 'all'
			? 'in selected chapter'
			: selectedSubjectId !== 'all'
				? 'in selected subject'
				: 'total';

	const columns = getSectionColumns({ chapterMap, onDelete: onDeleteRequest });

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
							{/* Subject Filter */}
							<Select
								onValueChange={handleSubjectChange}
								value={selectedSubjectId}
							>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="All Subjects" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Subjects</SelectItem>
									{subjects.map((s) => (
										<SelectItem key={s._id} value={s._id}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Chapter Filter */}
							<Select
								onValueChange={setSelectedChapterId}
								value={selectedChapterId}
							>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="All Chapters" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Chapters</SelectItem>
									{availableChapters.map((c) => (
										<SelectItem key={c._id} value={c._id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

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
				<DataTable
					columns={columns}
					data={filteredSections}
					defaultPageSize={20}
				/>
			</CardContent>
		</Card>
	);
}
