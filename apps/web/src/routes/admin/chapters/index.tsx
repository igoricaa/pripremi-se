import { Suspense, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@pripremi-se/backend/convex/_generated/api';
import { convexQuery } from '@/lib/convex';
import { CardWithTableSkeleton } from '@/components/admin/skeletons';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { DELETE_MESSAGES } from '@/lib/constants/admin-ui';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
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

			<Suspense fallback={<CardWithTableSkeleton preset="chapters" rows={20} filterWidth="w-[200px]" />}>
				<ChaptersCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			<DeleteConfirmDialog
				open={!!deleteId}
				onOpenChange={() => setDeleteId(null)}
				onConfirm={handleDelete}
				title={DELETE_MESSAGES.chapter.title}
				description={DELETE_MESSAGES.chapter.description}
			/>
		</div>
	);
}

function ChaptersCard({ onDeleteRequest }: { onDeleteRequest: (id: string) => void }) {
	const { data } = useSuspenseQuery(
		convexQuery(api.chapters.listChaptersWithSubjects, {})
	);

	const { chapters, subjects } = data;

	const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
	const [searchTerm, setSearchTerm] = useState('');

	const filteredChapters = chapters.filter((ch) => {
		if (selectedSubjectId !== 'all' && ch.subjectId !== selectedSubjectId) {
			return false;
		}
		if (searchTerm && !ch.name.toLowerCase().includes(searchTerm.toLowerCase())) {
			return false;
		}
		return true;
	});

	const hasActiveFilters = selectedSubjectId !== 'all' || searchTerm;

	const clearAllFilters = () => {
		setSelectedSubjectId('all');
		setSearchTerm('');
	};

	const subjectMap = new Map(subjects.map((s) => [s._id, s.name]));

	const columns = getChapterColumns({ subjectMap, onDelete: onDeleteRequest });

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
								{selectedSubjectId !== 'all' && !searchTerm && ' in selected subject'}
								{!searchTerm && selectedSubjectId === 'all' && ' total'}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Select
								value={selectedSubjectId}
								onValueChange={setSelectedSubjectId}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by subject" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Subjects</SelectItem>
									{subjects.map((subject) => (
										<SelectItem key={subject._id} value={subject._id}>
											{subject.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{hasActiveFilters && (
								<Button variant="outline" size="sm" onClick={clearAllFilters}>
									<X className="mr-2 h-4 w-4" />
									Clear
								</Button>
							)}
						</div>
					</div>

					<SearchInput
						value={searchTerm}
						onChange={setSearchTerm}
						placeholder="Search chapters..."
						className="max-w-sm"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={filteredChapters}
					defaultPageSize={20}
				/>
			</CardContent>
		</Card>
	);
}
