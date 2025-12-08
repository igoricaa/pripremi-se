import { Suspense, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@pripremi-se/backend/convex/_generated/api';
import { convexQuery } from '@/lib/convex';
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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
		setDeleteId(null); // Close dialog immediately

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
			<Suspense fallback={<CardWithTableSkeleton preset="sections" rows={20} filterWidth="w-[340px]" />}>
				<SectionsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			{/* Delete dialog - always available */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Section</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this section? This action cannot
							be undone. All lessons under this section must be deleted first.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function SectionsCard({
	onDeleteRequest,
}: { onDeleteRequest: (id: string) => void }) {
	// Single query - data already prefetched by loader
	const { data } = useSuspenseQuery(
		convexQuery(api.sections.listSectionsWithHierarchy, {})
	);

	const { sections, hierarchy } = data;
	const { subjects, chapters } = hierarchy;

	// Filter states for cascading dropdowns
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
	const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

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

	// Filter sections based on all selected levels
	const filteredSections = (() => {
		if (selectedChapterId !== 'all') {
			return sections.filter((s) => s.chapterId === selectedChapterId);
		}
		if (selectedSubjectId !== 'all') {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === selectedSubjectId)
					.map((c) => c._id)
			);
			return sections.filter((s) => chapterIds.has(s.chapterId));
		}
		return sections;
	})();

	// Determine description text
	const filterDescription =
		selectedChapterId !== 'all'
			? 'in selected chapter'
			: selectedSubjectId !== 'all'
				? 'in selected subject'
				: 'total';

	const columns = getSectionColumns({ chapterMap, onDelete: onDeleteRequest });

	return (
		<Card>
			<CardHeader>
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
							value={selectedSubjectId}
							onValueChange={handleSubjectChange}
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
							value={selectedChapterId}
							onValueChange={setSelectedChapterId}
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
					</div>
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
