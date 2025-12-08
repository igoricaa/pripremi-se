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
			<Suspense fallback={<CardWithTableSkeleton preset="sections" rows={20} filterWidth="w-[280px]" />}>
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

function SectionsCard({ onDeleteRequest }: { onDeleteRequest: (id: string) => void }) {
	// Single query - data already prefetched by loader
	const { data } = useSuspenseQuery(
		convexQuery(api.sections.listSectionsWithHierarchy, {})
	);

	const { sections, hierarchy } = data;
	const { subjects, chapters } = hierarchy;

	const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

	// Filter sections by selected chapter
	const filteredSections =
		selectedChapterId === 'all'
			? sections
			: sections.filter((s) => s.chapterId === selectedChapterId);

	// Create lookup maps for table rendering
	const chapterMap = new Map(chapters.map((c) => [c._id, c]));
	const subjectMap = new Map(subjects.map((s) => [s._id as string, s.name]));

	// Group chapters by subject for the dropdown
	const chaptersBySubject = new Map<string, typeof chapters>();
	for (const chapter of chapters) {
		const subjectId = chapter.subjectId as string;
		if (!chaptersBySubject.has(subjectId)) {
			chaptersBySubject.set(subjectId, []);
		}
		chaptersBySubject.get(subjectId)?.push(chapter);
	}

	const columns = getSectionColumns({ chapterMap, onDelete: onDeleteRequest });

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>All Sections</CardTitle>
						<CardDescription>
							{filteredSections.length} section
							{filteredSections.length !== 1 ? 's' : ''}{' '}
							{selectedChapterId !== 'all' ? 'in selected chapter' : 'total'}
						</CardDescription>
					</div>
					<Select
						value={selectedChapterId}
						onValueChange={setSelectedChapterId}
					>
						<SelectTrigger className="w-[280px]">
							<SelectValue placeholder="Filter by chapter" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Chapters</SelectItem>
							{Array.from(chaptersBySubject.entries()).map(
								([subjectId, subjectChapters]) => (
									<div key={subjectId}>
										<div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
											{subjectMap.get(subjectId) ?? 'Unknown Subject'}
										</div>
										{subjectChapters?.map((chapter) => (
											<SelectItem key={chapter._id} value={chapter._id}>
												{chapter.name}
											</SelectItem>
										))}
									</div>
								)
							)}
						</SelectContent>
					</Select>
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
