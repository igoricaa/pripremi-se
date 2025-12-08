import { Suspense, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@pripremi-se/backend/convex/_generated/api';
import { QUESTION_TYPES, QUESTION_DIFFICULTY, questionTypeLabels, difficultyLabels } from '@pripremi-se/shared';
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
import { getQuestionColumns } from './columns';

export const Route = createFileRoute('/admin/questions/')({
	loader: async ({ context }) => {
		if (typeof window === 'undefined' || !context.userId) {
			return;
		}

		context.queryClient.prefetchQuery(
			convexQuery(api.questions.listQuestionsForAdmin, {})
		);
	},
	component: QuestionsPage,
});

function QuestionsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteQuestion = useMutation(
		api.questions.deleteQuestion
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(api.questions.listQuestionsForAdmin, {});
		
		if (current === undefined) return;
		
		const updated = {
			...current,
			questions: current.questions.filter((item) => item._id !== args.id),
		};
		localStore.setQuery(api.questions.listQuestionsForAdmin, {}, updated);
		toast.success('Question deleted successfully');
	});

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteQuestion({ id: idToDelete });
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

			<Suspense fallback={<CardWithTableSkeleton preset="questions" rows={20} filterWidth="w-[600px]" />}>
				<QuestionsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Question</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this question? This action cannot
							be undone. Questions linked to tests cannot be deleted.
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

function QuestionsCard({
	onDeleteRequest,
}: {
	onDeleteRequest: (id: string) => void;
}) {
	const { data } = useSuspenseQuery(
		convexQuery(api.questions.listQuestionsForAdmin, {})
	);

	const { questions, hierarchy } = data;
	const { subjects, chapters, sections, lessons } = hierarchy;

	// Filter state
	const [selectedType, setSelectedType] = useState<string>('all');
	const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
	const [selectedSubject, setSelectedSubject] = useState<string>('all');
	const [selectedChapter, setSelectedChapter] = useState<string>('all');
	const [selectedSection, setSelectedSection] = useState<string>('all');
	const [selectedLesson, setSelectedLesson] = useState<string>('all');

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

	// Reset child filters when parent changes
	const handleSubjectChange = (value: string) => {
		setSelectedSubject(value);
		setSelectedChapter('all');
		setSelectedSection('all');
		setSelectedLesson('all');
	};

	const handleChapterChange = (value: string) => {
		setSelectedChapter(value);
		setSelectedSection('all');
		setSelectedLesson('all');
	};

	const handleSectionChange = (value: string) => {
		setSelectedSection(value);
		setSelectedLesson('all');
	};

	// Client-side filtering
	const filteredQuestions = questions.filter((q) => {
		if (selectedType !== 'all' && q.type !== selectedType) return false;
		if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
		if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) return false;
		if (selectedChapter !== 'all' && q.chapterId !== selectedChapter) return false;
		if (selectedSection !== 'all' && q.sectionId !== selectedSection) return false;
		if (selectedLesson !== 'all' && q.lessonId !== selectedLesson) return false;
		return true;
	});

	// Get available options for cascading dropdowns
	const availableChapters = selectedSubject !== 'all'
		? chaptersBySubject.get(selectedSubject) ?? []
		: chapters;
	const availableSections = selectedChapter !== 'all'
		? sectionsByChapter.get(selectedChapter) ?? []
		: sections;
	const availableLessons = selectedSection !== 'all'
		? lessonsBySection.get(selectedSection) ?? []
		: lessons;

	const columns = getQuestionColumns({ onDelete: onDeleteRequest });

	// Check if any filter is active
	const hasActiveFilters = selectedType !== 'all' || selectedDifficulty !== 'all' ||
		selectedSubject !== 'all' || selectedChapter !== 'all' ||
		selectedSection !== 'all' || selectedLesson !== 'all';

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4">
					<div>
						<CardTitle>All Questions</CardTitle>
						<CardDescription>
							{filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
							{hasActiveFilters && ' matching filters'}
						</CardDescription>
					</div>

					{/* Filter Row 1: Type & Difficulty */}
					<div className="flex flex-wrap gap-2">
						<Select value={selectedType} onValueChange={setSelectedType}>
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

						<Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
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
						<Select value={selectedSubject} onValueChange={handleSubjectChange}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Subject" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Subjects</SelectItem>
								{subjects.map((s) => (
									<SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={selectedChapter} onValueChange={handleChapterChange}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Chapter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Chapters</SelectItem>
								{availableChapters.map((c) => (
									<SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={selectedSection} onValueChange={handleSectionChange}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Section" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Sections</SelectItem>
								{availableSections.map((s) => (
									<SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={selectedLesson} onValueChange={setSelectedLesson}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Lesson" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Lessons</SelectItem>
								{availableLessons.map((l) => (
									<SelectItem key={l._id} value={l._id}>{l.title}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={filteredQuestions}
					defaultPageSize={20}
				/>
			</CardContent>
		</Card>
	);
}
