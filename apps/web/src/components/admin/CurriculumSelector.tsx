import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';

interface CurriculumSelectorProps {
	// Hierarchy state
	subjectId: string | undefined;
	chapterId: string | undefined;
	sectionId: string | undefined;
	lessonId: string | undefined;

	// Change handlers
	onSubjectChange: (id: string | undefined) => void;
	onChapterChange: (id: string | undefined) => void;
	onSectionChange: (id: string | undefined) => void;
	onLessonChange: (id: string | undefined) => void;

	// Data
	subjects: Array<{ _id: string; name: string }> | undefined;
	chapters: Array<{ _id: string; name: string }> | undefined;
	sections: Array<{ _id: string; name: string }> | undefined;
	lessons: Array<{ _id: string; title: string }> | undefined;
}

/**
 * Cascading curriculum hierarchy selector.
 * Subject -> Chapter -> Section -> Lesson
 */
export function CurriculumSelector({
	subjectId,
	chapterId,
	sectionId,
	lessonId,
	onSubjectChange,
	onChapterChange,
	onSectionChange,
	onLessonChange,
	subjects,
	chapters,
	sections,
	lessons,
}: CurriculumSelectorProps) {
	return (
		<div className="space-y-4">
			<Label className="text-sm font-medium">Link to Curriculum (optional)</Label>
			<p className="-mt-2 text-muted-foreground text-xs">
				Select a subject, then chapter, section, and optionally a lesson
			</p>

			<div className="space-y-2">
				<Label className="text-muted-foreground text-xs">Subject</Label>
				<Combobox
					options={subjects?.map((s) => ({ value: s._id, label: s.name })) ?? []}
					value={subjectId}
					onValueChange={onSubjectChange}
					placeholder="Select subject..."
					searchPlaceholder="Search subjects..."
					emptyText="No subjects found"
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-muted-foreground text-xs">Chapter</Label>
				<Combobox
					options={chapters?.map((c) => ({ value: c._id, label: c.name })) ?? []}
					value={chapterId}
					onValueChange={onChapterChange}
					placeholder={subjectId ? 'Select chapter...' : 'Select subject first'}
					searchPlaceholder="Search chapters..."
					emptyText="No chapters found"
					disabled={!subjectId}
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-muted-foreground text-xs">Section</Label>
				<Combobox
					options={sections?.map((s) => ({ value: s._id, label: s.name })) ?? []}
					value={sectionId}
					onValueChange={onSectionChange}
					placeholder={chapterId ? 'Select section...' : 'Select chapter first'}
					searchPlaceholder="Search sections..."
					emptyText="No sections found"
					disabled={!chapterId}
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-muted-foreground text-xs">Lesson</Label>
				<Combobox
					options={lessons?.map((l) => ({ value: l._id, label: l.title })) ?? []}
					value={lessonId}
					onValueChange={onLessonChange}
					placeholder={sectionId ? 'Select lesson (optional)...' : 'Select section first'}
					searchPlaceholder="Search lessons..."
					emptyText="No lessons found"
					disabled={!sectionId}
				/>
				<p className="text-muted-foreground text-xs">
					Link to a lesson for "Learn More" on incorrect answers
				</p>
			</div>
		</div>
	);
}
