import { Combobox } from '@/components/ui/combobox';
import type { HierarchyFilterState } from '@/hooks/use-hierarchy-filter-state';
import { cn } from '@/lib/utils';

type Level = 'subject' | 'chapter' | 'section' | 'lesson';

interface HierarchyFilterBarProps {
	levels: Level[];
	state: HierarchyFilterState;

	// Data sources
	subjects: Array<{ _id: string; name: string }>;
	chapters: Array<{ _id: string; name: string; subjectId: string }>;
	sections?: Array<{ _id: string; name: string; chapterId: string }>;
	lessons?: Array<{ _id: string; title: string; sectionId: string }>;

	className?: string;
	comboboxWidth?: string;
}

// Convert empty string to undefined (Combobox uses '' for "All", state uses undefined)
const toUndefined = (value: string | undefined): string | undefined =>
	value === '' ? undefined : value;

/**
 * Renders cascading Combobox filters for curriculum hierarchy.
 * Filters available options based on parent selection.
 */
export function HierarchyFilterBar({
	levels,
	state,
	subjects,
	chapters,
	sections = [],
	lessons = [],
	className,
	comboboxWidth = 'w-[160px]',
}: HierarchyFilterBarProps) {
	// Filter available options based on parent selection
	const availableChapters = state.subjectId
		? chapters.filter((c) => c.subjectId === state.subjectId)
		: chapters;

	const availableSections = (() => {
		if (state.chapterId) {
			return sections.filter((s) => s.chapterId === state.chapterId);
		}
		if (state.subjectId) {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === state.subjectId)
					.map((c) => c._id)
			);
			return sections.filter((s) => chapterIds.has(s.chapterId));
		}
		return sections;
	})();

	const availableLessons = (() => {
		if (state.sectionId) {
			return lessons.filter((l) => l.sectionId === state.sectionId);
		}
		if (state.chapterId) {
			const sectionIds = new Set(
				sections
					.filter((s) => s.chapterId === state.chapterId)
					.map((s) => s._id)
			);
			return lessons.filter((l) => sectionIds.has(l.sectionId));
		}
		if (state.subjectId) {
			const chapterIds = new Set(
				chapters
					.filter((c) => c.subjectId === state.subjectId)
					.map((c) => c._id)
			);
			const sectionIds = new Set(
				sections.filter((s) => chapterIds.has(s.chapterId)).map((s) => s._id)
			);
			return lessons.filter((l) => sectionIds.has(l.sectionId));
		}
		return lessons;
	})();

	return (
		<div className={cn('flex flex-wrap items-center gap-2', className)}>
			{levels.includes('subject') && (
				<div className={comboboxWidth}>
					<Combobox
						emptyText="No subjects found"
						onValueChange={(v) => state.onSubjectChange(toUndefined(v))}
						options={[
							{ value: '', label: 'All Subjects' },
							...subjects.map((s) => ({ value: s._id, label: s.name })),
						]}
						placeholder="All Subjects"
						searchPlaceholder="Search subjects..."
						value={state.subjectId ?? ''}
					/>
				</div>
			)}

			{levels.includes('chapter') && (
				<div className={comboboxWidth}>
					<Combobox
						emptyText="No chapters found"
						onValueChange={(v) => state.onChapterChange(toUndefined(v))}
						options={[
							{ value: '', label: 'All Chapters' },
							...availableChapters.map((c) => ({
								value: c._id,
								label: c.name,
							})),
						]}
						placeholder="All Chapters"
						searchPlaceholder="Search chapters..."
						value={state.chapterId ?? ''}
					/>
				</div>
			)}

			{levels.includes('section') && (
				<div className={comboboxWidth}>
					<Combobox
						emptyText="No sections found"
						onValueChange={(v) => state.onSectionChange(toUndefined(v))}
						options={[
							{ value: '', label: 'All Sections' },
							...availableSections.map((s) => ({
								value: s._id,
								label: s.name,
							})),
						]}
						placeholder="All Sections"
						searchPlaceholder="Search sections..."
						value={state.sectionId ?? ''}
					/>
				</div>
			)}

			{levels.includes('lesson') && (
				<div className={comboboxWidth}>
					<Combobox
						emptyText="No lessons found"
						onValueChange={(v) => state.onLessonChange(toUndefined(v))}
						options={[
							{ value: '', label: 'All Lessons' },
							...availableLessons.map((l) => ({
								value: l._id,
								label: l.title,
							})),
						]}
						placeholder="All Lessons"
						searchPlaceholder="Search lessons..."
						value={state.lessonId ?? ''}
					/>
				</div>
			)}
		</div>
	);
}
