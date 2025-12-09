import { Suspense, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { getLessonColumns } from './columns';
import { DELETE_MESSAGES } from '@/lib/constants/admin-ui';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';

export const Route = createFileRoute('/admin/lessons/')({
	loader: async ({ context }) => {
		if (typeof window === 'undefined') return;

		context.queryClient.prefetchQuery(
			convexQuery(api.lessons.listLessonsWithHierarchy, {})
		);
	},
	component: LessonsPage,
});

function LessonsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteLesson = useMutation(
		api.lessons.deleteLesson
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(
			api.lessons.listLessonsWithHierarchy,
			{}
		);
		if (current === undefined) return;
		const updated = {
			...current,
			lessons: current.lessons.filter((item) => item._id !== args.id),
		};
		localStore.setQuery(api.lessons.listLessonsWithHierarchy, {}, updated);
		toast.success('Lesson deleted successfully');
	});

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteLesson({ id: idToDelete });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete lesson'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Lessons</h1>
					<p className="text-muted-foreground">Manage curriculum lessons</p>
				</div>
				<Button asChild>
					<Link to="/admin/lessons/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Lesson
					</Link>
				</Button>
			</div>

			<Suspense fallback={<CardWithTableSkeleton preset="lessons" rows={20} filterWidth="w-[500px]" />}>
				<LessonsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			<DeleteConfirmDialog
				open={!!deleteId}
				onOpenChange={() => setDeleteId(null)}
				onConfirm={handleDelete}
				title={DELETE_MESSAGES.lesson.title}
				description={DELETE_MESSAGES.lesson.description}
			/>
		</div>
	);
}

function LessonsCard({
	onDeleteRequest,
}: { onDeleteRequest: (id: string) => void }) {
	const { data } = useSuspenseQuery(
		convexQuery(api.lessons.listLessonsWithHierarchy, {})
	);

	const { lessons, hierarchy } = data;
	const { subjects, chapters, sections } = hierarchy;

	// Filter states for cascading dropdowns
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
	const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
	const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
	const [searchTerm, setSearchTerm] = useState('');

	// Create lookup maps for table rendering
	const sectionMap = new Map(sections.map((s) => [s._id, s]));
	const chapterMap = new Map(chapters.map((c) => [c._id, c]));

	// Cascading reset handlers
	const handleSubjectChange = (value: string) => {
		setSelectedSubjectId(value);
		setSelectedChapterId('all');
		setSelectedSectionId('all');
	};

	const handleChapterChange = (value: string) => {
		setSelectedChapterId(value);
		setSelectedSectionId('all');
	};

	// Chapters available based on selected subject
	const availableChapters =
		selectedSubjectId === 'all'
			? chapters
			: chapters.filter((c) => c.subjectId === selectedSubjectId);

	// Sections available based on selected chapter (or subject if no chapter selected)
	const availableSections = (() => {
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

	// Filter lessons based on all selected levels and search
	const filteredLessons = (() => {
		let result = lessons;

		if (selectedSectionId !== 'all') {
			result = result.filter((l) => l.sectionId === selectedSectionId);
		} else if (selectedChapterId !== 'all') {
			const sectionIds = new Set(
				sections
					.filter((s) => s.chapterId === selectedChapterId)
					.map((s) => s._id)
			);
			result = result.filter((l) => sectionIds.has(l.sectionId));
		} else if (selectedSubjectId !== 'all') {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === selectedSubjectId)
					.map((c) => c._id)
			);
			const sectionIds = new Set(
				sections.filter((s) => chapterIds.has(s.chapterId)).map((s) => s._id)
			);
			result = result.filter((l) => sectionIds.has(l.sectionId));
		}

		if (searchTerm) {
			result = result.filter((l) =>
				l.title.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return result;
	})();

	const hasActiveFilters =
		selectedSubjectId !== 'all' ||
		selectedChapterId !== 'all' ||
		selectedSectionId !== 'all' ||
		searchTerm;

	const clearAllFilters = () => {
		setSelectedSubjectId('all');
		setSelectedChapterId('all');
		setSelectedSectionId('all');
		setSearchTerm('');
	};

	// Determine description text
	const filterDescription = searchTerm
		? 'matching search'
		: selectedSectionId !== 'all'
			? 'in selected section'
			: selectedChapterId !== 'all'
				? 'in selected chapter'
				: selectedSubjectId !== 'all'
					? 'in selected subject'
					: 'total';

	const columns = getLessonColumns({
		sectionMap,
		chapterMap,
		onDelete: onDeleteRequest,
	});

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>All Lessons</CardTitle>
							<CardDescription>
								{filteredLessons.length} lesson
								{filteredLessons.length !== 1 ? 's' : ''} {filterDescription}
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
								onValueChange={handleChapterChange}
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

							{/* Section Filter */}
							<Select
								value={selectedSectionId}
								onValueChange={setSelectedSectionId}
							>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="All Sections" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Sections</SelectItem>
									{availableSections.map((s) => (
										<SelectItem key={s._id} value={s._id}>
											{s.name}
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
						placeholder="Search lessons..."
						className="max-w-sm"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={filteredLessons}
					defaultPageSize={20}
				/>
			</CardContent>
		</Card>
	);
}
