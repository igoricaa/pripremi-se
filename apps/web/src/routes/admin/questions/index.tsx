import { api } from '@pripremi-se/backend/convex/_generated/api';
import type { Id } from '@pripremi-se/backend/convex/_generated/dataModel';
import {
	difficultyLabels,
	QUESTION_DIFFICULTY,
	QUESTION_TYPES,
	questionTypeLabels,
} from '@pripremi-se/shared';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { Plus, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import {
	QuestionsFiltersSkeleton,
	TableContentSkeleton,
} from '@/components/admin/skeletons';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { DataTable, type PaginationState } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { DELETE_MESSAGES } from '@/lib/constants/admin-ui';
import { convexQuery } from '@/lib/convex';
import { getQuestionColumns } from './columns';

// URL search params schema for server-side pagination
interface QuestionsSearch {
	q?: string; // Search term
	page?: number;
	pageSize?: number;
	type?: string;
	difficulty?: string;
	subjectId?: string;
	chapterId?: string;
	sectionId?: string;
	lessonId?: string;
}

export const Route = createFileRoute('/admin/questions/')({
	validateSearch: (search: Record<string, unknown>): QuestionsSearch => ({
		q: search.q as string | undefined,
		page: search.page ? Number(search.page) : undefined,
		pageSize: search.pageSize ? Number(search.pageSize) : undefined,
		type: search.type as string | undefined,
		difficulty: search.difficulty as string | undefined,
		subjectId: search.subjectId as string | undefined,
		chapterId: search.chapterId as string | undefined,
		sectionId: search.sectionId as string | undefined,
		lessonId: search.lessonId as string | undefined,
	}),
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) => {
		if (typeof window === 'undefined' || !context.userId) {
			return;
		}

		// Prefetch filter options (cached longer - 30 min staleTime on frontend)
		context.queryClient.prefetchQuery(
			convexQuery(api.questions.getQuestionFilterOptions, {})
		);

		// Prefetch first page of paginated data
		context.queryClient.prefetchQuery(
			convexQuery(api.questions.listQuestionsPaginated, {
				pageSize: deps.pageSize ?? 20,
				searchTerm: deps.q,
				type: deps.type,
				difficulty: deps.difficulty,
				subjectId: deps.subjectId as Id<'subjects'> | undefined,
				chapterId: deps.chapterId as Id<'chapters'> | undefined,
				sectionId: deps.sectionId as Id<'sections'> | undefined,
				lessonId: deps.lessonId as Id<'lessons'> | undefined,
			})
		);

		// Prefetch total count
		context.queryClient.prefetchQuery(
			convexQuery(api.questions.countQuestionsForAdmin, {
				searchTerm: deps.q,
				type: deps.type,
				difficulty: deps.difficulty,
				subjectId: deps.subjectId as Id<'subjects'> | undefined,
				chapterId: deps.chapterId as Id<'chapters'> | undefined,
				sectionId: deps.sectionId as Id<'sections'> | undefined,
				lessonId: deps.lessonId as Id<'lessons'> | undefined,
			})
		);
	},
	component: QuestionsPage,
});

function QuestionsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteQuestion = useMutation(api.questions.deleteQuestion);

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteQuestion({ id: idToDelete });
			toast.success('Question deleted successfully');
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete question'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Questions</h1>
					<p className="text-muted-foreground">Manage question bank</p>
				</div>
				<Button asChild>
					<Link to="/admin/questions/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Question
					</Link>
				</Button>
			</div>

			<Card>
				{/* Filters - wrapped in own Suspense for filter options loading */}
				<Suspense fallback={<QuestionsFiltersSkeleton />}>
					<QuestionsFilters />
				</Suspense>

				{/* Table - wrapped in Suspense, only this shows skeleton on filter/search change */}
				<Suspense
					fallback={<TableContentSkeleton preset="questions" rows={20} />}
				>
					<QuestionsTable onDeleteRequest={(id) => setDeleteId(id)} />
				</Suspense>
			</Card>

			<DeleteConfirmDialog
				description={DELETE_MESSAGES.question.description}
				onConfirm={handleDelete}
				onOpenChange={() => setDeleteId(null)}
				open={!!deleteId}
				title={DELETE_MESSAGES.question.title}
			/>
		</div>
	);
}

/**
 * QuestionsFilters - Header section with search and filter dropdowns
 * Wrapped in its own Suspense boundary to stay visible during table loading
 */
function QuestionsFilters() {
	const search = Route.useSearch();
	const navigate = useNavigate();

	// Local search input state (updates on every keystroke)
	const [searchInput, setSearchInput] = useState(search.q ?? '');

	// Debounced value (updates URL after 300ms pause)
	const debouncedSearch = useDebounce(searchInput, 300);

	// Get hierarchy data for filter dropdowns (cached with 30 min staleTime)
	const { data: filterOptions } = useSuspenseQuery({
		...convexQuery(api.questions.getQuestionFilterOptions, {}),
		staleTime: 30 * 60 * 1000, // 30 minutes
	});

	const { subjects, chapters, sections, lessons } = filterOptions;

	// Build hierarchy maps for cascading filters
	const chaptersBySubject = (() => {
		const map = new Map<string, typeof chapters>();
		for (const chapter of chapters) {
			const subjectId = chapter.subjectId as string;
			const list = map.get(subjectId) ?? [];
			list.push(chapter);
			map.set(subjectId, list);
		}
		return map;
	})();

	const sectionsByChapter = (() => {
		const map = new Map<string, typeof sections>();
		for (const section of sections) {
			const chapterId = section.chapterId as string;
			const list = map.get(chapterId) ?? [];
			list.push(section);
			map.set(chapterId, list);
		}
		return map;
	})();

	const lessonsBySection = (() => {
		const map = new Map<string, typeof lessons>();
		for (const lesson of lessons) {
			const sectionId = lesson.sectionId as string;
			const list = map.get(sectionId) ?? [];
			list.push(lesson);
			map.set(sectionId, list);
		}
		return map;
	})();

	// Navigation helper - updates URL search params
	const updateSearch = (updates: Partial<QuestionsSearch>) => {
		navigate({
			to: '/admin/questions',
			search: (prev) => {
				const newSearch = { ...prev, ...updates };
				// Remove undefined/null values
				for (const [key, value] of Object.entries(newSearch)) {
					if (value === undefined || value === null || value === 'all') {
						delete newSearch[key as keyof QuestionsSearch];
					}
				}
				return newSearch;
			},
		});
	};

	// Sync debounced search to URL
	useEffect(() => {
		if (debouncedSearch !== (search.q ?? '')) {
			updateSearch({
				q: debouncedSearch || undefined,
				page: undefined,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	// Reset filters and pagination
	const handleFilterChange = (
		filterKey: keyof QuestionsSearch,
		value: string | undefined
	) => {
		// Build updates based on filter hierarchy
		const updates: Partial<QuestionsSearch> = {
			[filterKey]: value === 'all' ? undefined : value,
			page: undefined, // Reset to page 1
		};

		// Cascade reset child filters when parent changes
		if (filterKey === 'subjectId') {
			updates.chapterId = undefined;
			updates.sectionId = undefined;
			updates.lessonId = undefined;
		} else if (filterKey === 'chapterId') {
			updates.sectionId = undefined;
			updates.lessonId = undefined;
		} else if (filterKey === 'sectionId') {
			updates.lessonId = undefined;
		}

		updateSearch(updates);
	};

	// Get available options for cascading dropdowns
	const availableChapters = search.subjectId
		? (chaptersBySubject.get(search.subjectId) ?? [])
		: chapters;
	const availableSections = search.chapterId
		? (sectionsByChapter.get(search.chapterId) ?? [])
		: sections;
	const availableLessons = search.sectionId
		? (lessonsBySection.get(search.sectionId) ?? [])
		: lessons;

	// Check if any filter or search is active
	const hasActiveFilters =
		search.q ||
		search.type ||
		search.difficulty ||
		search.subjectId ||
		search.chapterId ||
		search.sectionId ||
		search.lessonId;

	const clearAllFilters = () => {
		setSearchInput(''); // Clear local search input
		navigate({ to: '/admin/questions', search: {} });
	};

	return (
		<CardHeader>
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>All Questions</CardTitle>
						<CardDescription>
							Manage questions
							{search.q && ' matching search'}
							{(search.type ||
								search.difficulty ||
								search.subjectId ||
								search.chapterId ||
								search.sectionId ||
								search.lessonId) &&
								' with filters'}
						</CardDescription>
					</div>
					{hasActiveFilters && (
						<Button onClick={clearAllFilters} size="sm" variant="outline">
							<X className="mr-2 h-4 w-4" />
							Clear Filters
						</Button>
					)}
				</div>

				{/* Search Input */}
				<SearchInput
					className="max-w-sm"
					onChange={setSearchInput}
					placeholder="Search questions..."
					value={searchInput}
				/>

				{/* Filter Row 1: Type & Difficulty */}
				<div className="flex flex-wrap gap-2">
					<Select
						onValueChange={(value) => handleFilterChange('type', value)}
						value={search.type ?? 'all'}
					>
						<SelectTrigger className="w-[150px]">
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{Object.entries(QUESTION_TYPES).map(([, value]) => (
								<SelectItem key={value} value={value}>
									{questionTypeLabels[value]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						onValueChange={(value) => handleFilterChange('difficulty', value)}
						value={search.difficulty ?? 'all'}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Difficulty" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Levels</SelectItem>
							{Object.entries(QUESTION_DIFFICULTY).map(([, value]) => (
								<SelectItem key={value} value={value}>
									{difficultyLabels[value]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Filter Row 2: Hierarchy */}
				<div className="flex flex-wrap gap-2">
					<Select
						onValueChange={(value) => handleFilterChange('subjectId', value)}
						value={search.subjectId ?? 'all'}
					>
						<SelectTrigger className="w-[150px]">
							<SelectValue placeholder="Subject" />
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

					<Select
						onValueChange={(value) => handleFilterChange('chapterId', value)}
						value={search.chapterId ?? 'all'}
					>
						<SelectTrigger className="w-[150px]">
							<SelectValue placeholder="Chapter" />
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

					<Select
						onValueChange={(value) => handleFilterChange('sectionId', value)}
						value={search.sectionId ?? 'all'}
					>
						<SelectTrigger className="w-[150px]">
							<SelectValue placeholder="Section" />
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

					<Select
						onValueChange={(value) => handleFilterChange('lessonId', value)}
						value={search.lessonId ?? 'all'}
					>
						<SelectTrigger className="w-[150px]">
							<SelectValue placeholder="Lesson" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Lessons</SelectItem>
							{availableLessons.map((l) => (
								<SelectItem key={l._id} value={l._id}>
									{l.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</CardHeader>
	);
}

/**
 * QuestionsTable - Table with pagination, fetches data based on URL params
 * Wrapped in Suspense - shows skeleton when filters/search change
 */
function QuestionsTable({
	onDeleteRequest,
}: {
	onDeleteRequest: (id: string) => void;
}) {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// Pagination state from URL
	const pageSize = search.pageSize ?? 20;
	const pageIndex = (search.page ?? 1) - 1; // URL is 1-indexed, internal is 0-indexed

	// Cursor stack for pagination navigation
	// Index 0 = page 1 (null cursor), Index 1 = page 2 cursor, etc.
	const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);

	// Current filter values from URL
	const filters = {
		type: search.type,
		difficulty: search.difficulty,
		subjectId: search.subjectId as Id<'subjects'> | undefined,
		chapterId: search.chapterId as Id<'chapters'> | undefined,
		sectionId: search.sectionId as Id<'sections'> | undefined,
		lessonId: search.lessonId as Id<'lessons'> | undefined,
	};

	// Get cursor for current page
	const currentCursor = cursorStack[pageIndex] ?? null;

	// Fetch paginated data (include searchTerm from URL)
	const { data: pageData } = useSuspenseQuery(
		convexQuery(api.questions.listQuestionsPaginated, {
			cursor: currentCursor ?? undefined,
			pageSize,
			searchTerm: search.q,
			...filters,
		})
	);

	// Fetch total count for pagination UI (include searchTerm from URL)
	const { data: countData } = useSuspenseQuery({
		...convexQuery(api.questions.countQuestionsForAdmin, {
			searchTerm: search.q,
			...filters,
		}),
		staleTime: 60 * 60 * 1000, // 1 hour
	});

	const { questions, nextCursor } = pageData;
	const totalCount = countData.count;
	const pageCount = Math.ceil(totalCount / pageSize);

	// Reset cursor stack when filters/search change
	useEffect(() => {
		setCursorStack([null]);
	}, [
		search.q,
		search.type,
		search.difficulty,
		search.subjectId,
		search.chapterId,
		search.sectionId,
		search.lessonId,
	]);

	// Prefetch next page when we have a nextCursor for instant navigation
	useEffect(() => {
		if (nextCursor) {
			queryClient.prefetchQuery(
				convexQuery(api.questions.listQuestionsPaginated, {
					cursor: nextCursor,
					pageSize,
					searchTerm: search.q,
					...filters,
				})
			);
		}
	}, [nextCursor, pageSize, search.q, filters, queryClient]);

	// Navigation helper - updates URL search params
	const updateSearch = (updates: Partial<QuestionsSearch>) => {
		navigate({
			to: '/admin/questions',
			search: (prev) => {
				const newSearch = { ...prev, ...updates };
				// Remove undefined/null values
				for (const [key, value] of Object.entries(newSearch)) {
					if (value === undefined || value === null || value === 'all') {
						delete newSearch[key as keyof QuestionsSearch];
					}
				}
				return newSearch;
			},
		});
	};

	// Handle pagination changes
	const handlePaginationChange = (pagination: PaginationState) => {
		const newPageIndex = pagination.pageIndex;
		const newPageSize = pagination.pageSize;

		// Handle page size change - reset to page 1
		if (newPageSize !== pageSize) {
			setCursorStack([null]);
			updateSearch({
				page: undefined,
				pageSize: newPageSize === 20 ? undefined : newPageSize,
			});
			return;
		}

		// Handle going to first page - reset cursor stack for cleanliness
		if (newPageIndex === 0 && pageIndex > 0) {
			setCursorStack([null]);
			updateSearch({ page: undefined });
			return;
		}

		// Handle page navigation
		if (newPageIndex > pageIndex) {
			// Moving forward - add next cursor to stack if we have it
			if (nextCursor && newPageIndex === cursorStack.length) {
				setCursorStack((prev) => [...prev, nextCursor]);
			}
		}
		// Moving backward uses existing cursor from stack

		updateSearch({ page: newPageIndex === 0 ? undefined : newPageIndex + 1 });
	};

	const columns = getQuestionColumns({ onDelete: onDeleteRequest });

	return (
		<CardContent>
			{/* Show count here since we have it */}
			<p className="mb-4 text-muted-foreground text-sm">
				{totalCount} question{totalCount !== 1 ? 's' : ''} found
			</p>

			<DataTable
				columns={columns}
				data={questions}
				defaultPageSize={20}
				// Server-side pagination
				disableRandomAccess
				manualPagination
				onPaginationChange={handlePaginationChange}
				pageCount={pageCount}
				pageIndex={pageIndex}
				pageSize={pageSize}
				rowCount={totalCount}
			/>
		</CardContent>
	);
}
