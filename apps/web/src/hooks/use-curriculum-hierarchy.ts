import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import type { Id, Doc } from '@pripremi-se/backend/convex/_generated/dataModel';

interface UseCurriculumHierarchyOptions {
	/** Initial lessonId to reverse-lookup hierarchy from (for edit mode) */
	initialLessonId?: Id<'lessons'> | null;
}

interface UseCurriculumHierarchyReturn {
	// State values
	subjectId: string | undefined;
	chapterId: string | undefined;
	sectionId: string | undefined;

	// Setters with cascade reset
	setSubjectId: (id: string | undefined) => void;
	setChapterId: (id: string | undefined) => void;
	setSectionId: (id: string | undefined) => void;

	// Reset function that clears lessonId via callback
	resetLesson: () => void;
	setResetLessonCallback: (callback: () => void) => void;

	// Query results
	subjects: Doc<'subjects'>[] | undefined;
	chapters: Doc<'chapters'>[] | undefined;
	sections: Doc<'sections'>[] | undefined;
	lessons: Doc<'lessons'>[] | undefined;

	// Loading state
	isHierarchyInitialized: boolean;
}

/**
 * Hook for managing curriculum hierarchy state and queries.
 * Handles cascading resets when parent levels change.
 * Supports reverse-lookup initialization from an existing lessonId.
 */
export function useCurriculumHierarchy(
	options: UseCurriculumHierarchyOptions = {}
): UseCurriculumHierarchyReturn {
	const { initialLessonId } = options;

	// Hierarchy state
	const [subjectId, setSubjectIdState] = useState<string>();
	const [chapterId, setChapterIdState] = useState<string>();
	const [sectionId, setSectionIdState] = useState<string>();

	// Track which lessonId was used to initialize (null = no lessonId, undefined = not initialized)
	const [initializedFromLessonId, setInitializedFromLessonId] = useState<
		string | null | undefined
	>(undefined);

	// Use ref for callback to avoid infinite loops (doesn't need to trigger re-renders)
	const resetLessonCallbackRef = useRef<() => void>(() => {});

	// Hierarchical queries - each level only loads when parent is selected
	const subjects = useQuery(api.subjects.listSubjects, {});
	const chapters = useQuery(
		api.chapters.listChaptersBySubject,
		subjectId ? { subjectId: subjectId as Id<'subjects'> } : 'skip'
	);
	const sections = useQuery(
		api.sections.listSectionsByChapter,
		chapterId ? { chapterId: chapterId as Id<'chapters'> } : 'skip'
	);
	const lessons = useQuery(
		api.lessons.listLessonsBySection,
		sectionId ? { sectionId: sectionId as Id<'sections'> } : 'skip'
	);

	// Reverse-lookup queries to initialize hierarchy from existing lessonId
	const linkedLesson = useQuery(
		api.lessons.getLessonById,
		initialLessonId ? { id: initialLessonId as string } : 'skip'
	);
	const linkedSection = useQuery(
		api.sections.getSectionById,
		linkedLesson?.sectionId ? { id: linkedLesson.sectionId as string } : 'skip'
	);
	const linkedChapter = useQuery(
		api.chapters.getChapterById,
		linkedSection?.chapterId ? { id: linkedSection.chapterId as string } : 'skip'
	);

	// Initialize hierarchy from reverse-lookup when data is available
	// Re-initialize if initialLessonId changes (from null to actual value)
	useEffect(() => {
		// Convert to comparable string (null stays null, Id becomes string)
		const currentLessonIdKey = initialLessonId ?? null;

		// Skip if we already initialized from this lessonId
		if (initializedFromLessonId === currentLessonIdKey) {
			return;
		}

		// If there's an initialLessonId, wait for reverse-lookup data before initializing
		if (initialLessonId) {
			if (linkedChapter && linkedSection && linkedLesson) {
				setSubjectIdState(linkedChapter.subjectId as string);
				setChapterIdState(linkedSection.chapterId as string);
				setSectionIdState(linkedLesson.sectionId as string);
				setInitializedFromLessonId(currentLessonIdKey);
			}
			// Still waiting for data - don't mark as initialized yet
		} else {
			// No initialLessonId - mark as initialized with null
			setInitializedFromLessonId(null);
		}
	}, [initialLessonId, linkedChapter, linkedSection, linkedLesson, initializedFromLessonId]);

	// Cascade reset functions (React Compiler handles memoization)
	const setSubjectId = (id: string | undefined) => {
		setSubjectIdState(id);
		setChapterIdState(undefined);
		setSectionIdState(undefined);
		resetLessonCallbackRef.current();
	};

	const setChapterId = (id: string | undefined) => {
		setChapterIdState(id);
		setSectionIdState(undefined);
		resetLessonCallbackRef.current();
	};

	const setSectionId = (id: string | undefined) => {
		setSectionIdState(id);
		resetLessonCallbackRef.current();
	};

	const setResetLessonCallback = (callback: () => void) => {
		resetLessonCallbackRef.current = callback;
	};

	// Initialized when we've processed the initialLessonId (whether null or actual value)
	const isHierarchyInitialized = initializedFromLessonId !== undefined;

	return {
		subjectId,
		chapterId,
		sectionId,
		setSubjectId,
		setChapterId,
		setSectionId,
		resetLesson: resetLessonCallbackRef.current,
		setResetLessonCallback,
		subjects,
		chapters,
		sections,
		lessons,
		isHierarchyInitialized,
	};
}
