import { useState } from 'react';

type Level = 'subject' | 'chapter' | 'section' | 'lesson';

export interface HierarchyFilterState {
	subjectId: string | undefined;
	chapterId: string | undefined;
	sectionId: string | undefined;
	lessonId: string | undefined;

	onSubjectChange: (id: string | undefined) => void;
	onChapterChange: (id: string | undefined) => void;
	onSectionChange: (id: string | undefined) => void;
	onLessonChange: (id: string | undefined) => void;

	hasActiveFilters: boolean;
	clearAll: () => void;
}

interface UseHierarchyFilterStateOptions {
	levels: Level[];
	initialValues?: {
		subjectId?: string;
		chapterId?: string;
		sectionId?: string;
		lessonId?: string;
	};
}

/**
 * Hook for managing hierarchy filter state with cascading resets.
 * When a parent level changes, all child levels are reset to undefined.
 */
export function useHierarchyFilterState(
	options: UseHierarchyFilterStateOptions
): HierarchyFilterState {
	const { levels, initialValues } = options;

	const [subjectId, setSubjectIdState] = useState<string | undefined>(
		initialValues?.subjectId
	);
	const [chapterId, setChapterIdState] = useState<string | undefined>(
		initialValues?.chapterId
	);
	const [sectionId, setSectionIdState] = useState<string | undefined>(
		initialValues?.sectionId
	);
	const [lessonId, setLessonIdState] = useState<string | undefined>(
		initialValues?.lessonId
	);

	// Cascade reset handlers
	const onSubjectChange = (id: string | undefined) => {
		setSubjectIdState(id);
		if (levels.includes('chapter')) setChapterIdState(undefined);
		if (levels.includes('section')) setSectionIdState(undefined);
		if (levels.includes('lesson')) setLessonIdState(undefined);
	};

	const onChapterChange = (id: string | undefined) => {
		setChapterIdState(id);
		if (levels.includes('section')) setSectionIdState(undefined);
		if (levels.includes('lesson')) setLessonIdState(undefined);
	};

	const onSectionChange = (id: string | undefined) => {
		setSectionIdState(id);
		if (levels.includes('lesson')) setLessonIdState(undefined);
	};

	const onLessonChange = (id: string | undefined) => {
		setLessonIdState(id);
	};

	const clearAll = () => {
		if (levels.includes('subject')) setSubjectIdState(undefined);
		if (levels.includes('chapter')) setChapterIdState(undefined);
		if (levels.includes('section')) setSectionIdState(undefined);
		if (levels.includes('lesson')) setLessonIdState(undefined);
	};

	const hasActiveFilters =
		(levels.includes('subject') && !!subjectId) ||
		(levels.includes('chapter') && !!chapterId) ||
		(levels.includes('section') && !!sectionId) ||
		(levels.includes('lesson') && !!lessonId);

	return {
		subjectId,
		chapterId,
		sectionId,
		lessonId,
		onSubjectChange,
		onChapterChange,
		onSectionChange,
		onLessonChange,
		hasActiveFilters,
		clearAll,
	};
}

interface UrlSearchParams {
	subjectId?: string;
	chapterId?: string;
	sectionId?: string;
	lessonId?: string;
}

/**
 * Creates a HierarchyFilterState adapter for URL search params.
 * Converts between URL state (using 'all' or undefined) and the state interface.
 */
export function createUrlHierarchyState(
	search: UrlSearchParams,
	updateSearch: (updates: Partial<UrlSearchParams>) => void
): HierarchyFilterState {
	const onSubjectChange = (id: string | undefined) => {
		updateSearch({
			subjectId: id,
			chapterId: undefined,
			sectionId: undefined,
			lessonId: undefined,
		});
	};

	const onChapterChange = (id: string | undefined) => {
		updateSearch({
			chapterId: id,
			sectionId: undefined,
			lessonId: undefined,
		});
	};

	const onSectionChange = (id: string | undefined) => {
		updateSearch({
			sectionId: id,
			lessonId: undefined,
		});
	};

	const onLessonChange = (id: string | undefined) => {
		updateSearch({ lessonId: id });
	};

	const clearAll = () => {
		updateSearch({
			subjectId: undefined,
			chapterId: undefined,
			sectionId: undefined,
			lessonId: undefined,
		});
	};

	const hasActiveFilters =
		!!search.subjectId ||
		!!search.chapterId ||
		!!search.sectionId ||
		!!search.lessonId;

	return {
		subjectId: search.subjectId,
		chapterId: search.chapterId,
		sectionId: search.sectionId,
		lessonId: search.lessonId,
		onSubjectChange,
		onChapterChange,
		onSectionChange,
		onLessonChange,
		hasActiveFilters,
		clearAll,
	};
}
