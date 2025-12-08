import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import type { Id } from '@pripremi-se/backend/convex/_generated/dataModel';
import { useForm } from '@tanstack/react-form';
import {
	createQuestionWithOptionsSchema,
	QUESTION_TYPES,
	QUESTION_DIFFICULTY,
	questionTypeLabels,
	difficultyLabels,
	questionTypeRequiresOptions,
	type QuestionType,
	type QuestionDifficulty,
} from '@pripremi-se/shared';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { QuestionOptionsEditor, type QuestionOption } from '@/components/admin/QuestionOptionsEditor';
import { useState } from 'react';

export const Route = createFileRoute('/admin/questions/new')({
	component: NewQuestionPage,
});

function NewQuestionPage() {
	const navigate = useNavigate();
	const createQuestionWithOptions = useMutation(api.questions.createQuestionWithOptions);

	// Hierarchy state for curriculum linking
	const [subjectId, setSubjectId] = useState<string>();
	const [chapterId, setChapterId] = useState<string>();
	const [sectionId, setSectionId] = useState<string>();

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

	const [options, setOptions] = useState<QuestionOption[]>([
		{ text: '', isCorrect: false, order: 0 },
		{ text: '', isCorrect: false, order: 1 },
	]);

	// Local state to track question type for immediate UI updates
	// TanStack Form's form.state.values is NOT reactive outside form.Field/form.Subscribe
	const [currentQuestionType, setCurrentQuestionType] = useState<QuestionType>(QUESTION_TYPES.SINGLE_CHOICE);

	const form = useForm({
		defaultValues: {
			text: '',
			explanation: '',
			type: QUESTION_TYPES.SINGLE_CHOICE as QuestionType,
			points: 1,
			allowPartialCredit: false,
			lessonId: undefined as string | undefined,
			difficulty: QUESTION_DIFFICULTY.MEDIUM as QuestionDifficulty,
			isActive: false,
		},
		onSubmit: async ({ value }) => {
			try {
				const questionType = value.type;
				const needsOptions = questionTypeRequiresOptions(questionType);

				// Validate options for types that need them
				if (needsOptions) {
					const correctCount = options.filter((o) => o.isCorrect).length;

					if (questionType === QUESTION_TYPES.SINGLE_CHOICE || questionType === QUESTION_TYPES.TRUE_FALSE) {
						if (correctCount !== 1) {
							toast.error('Please select exactly one correct answer');
							return;
						}
					} else if (questionType === QUESTION_TYPES.MULTIPLE_CHOICE) {
						if (correctCount < 1) {
							toast.error('Please select at least one correct answer');
							return;
						}
					}

					// Validate option text
					const emptyOptions = options.filter((o) => !o.text.trim());
					if (emptyOptions.length > 0 && questionType !== QUESTION_TYPES.TRUE_FALSE) {
						toast.error('Please fill in all option texts');
						return;
					}
				}

				const questionData = {
					text: value.text,
					explanation: value.explanation || undefined,
					type: value.type,
					points: value.points,
					allowPartialCredit: value.allowPartialCredit,
					lessonId: value.lessonId || undefined,
					difficulty: value.difficulty || undefined,
					isActive: value.isActive,
				};

				const data = createQuestionWithOptionsSchema.parse({
					question: questionData,
					options: needsOptions ? options : [],
				});

				await createQuestionWithOptions(data);
				toast.success('Question created successfully');
				navigate({ to: '/admin/questions', search: { limit: 20, type: 'all', difficulty: 'all' } });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to create question'
				);
			}
		},
	});

	// Use local state for UI reactivity (form.state.values.type is not reactive outside form.Field)
	const needsOptions = questionTypeRequiresOptions(currentQuestionType);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link 
						to="/admin/questions" 
						search={{ limit: 20, type: 'all', difficulty: 'all' }}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">New Question</h1>
					<p className="text-muted-foreground">Create a new question</p>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div className="grid gap-6 lg:grid-cols-3">
					{/* Main content */}
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Question Content</CardTitle>
								<CardDescription>Write your question</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<form.Field name="text">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="text">Question Text *</Label>
											<Textarea
												id="text"
												placeholder="Enter your question here..."
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												rows={4}
											/>
											{field.state.meta.errors.length > 0 && (
												<p className="text-destructive text-sm">
													{field.state.meta.errors.join(', ')}
												</p>
											)}
										</div>
									)}
								</form.Field>

								<form.Field name="explanation">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="explanation">Explanation (optional)</Label>
											<Textarea
												id="explanation"
												placeholder="Explanation shown after answering..."
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												rows={3}
											/>
											<p className="text-muted-foreground text-xs">
												This will be shown to students after they answer
											</p>
										</div>
									)}
								</form.Field>
							</CardContent>
						</Card>

						{needsOptions && (
							<Card>
								<CardHeader>
									<CardTitle>Answer Options</CardTitle>
									<CardDescription>
										{currentQuestionType === QUESTION_TYPES.SINGLE_CHOICE &&
											'Add options and mark one as correct'}
										{currentQuestionType === QUESTION_TYPES.MULTIPLE_CHOICE &&
											'Add options and mark all correct answers'}
										{currentQuestionType === QUESTION_TYPES.TRUE_FALSE &&
											'Select the correct answer'}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<QuestionOptionsEditor
										questionType={currentQuestionType}
										options={options}
										onChange={setOptions}
									/>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Settings</CardTitle>
								<CardDescription>Configure question settings</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<form.Field name="type">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="type">Question Type *</Label>
											<Select
												value={field.state.value}
												onValueChange={(value) => {
													const newType = value as QuestionType;
													const prevType = currentQuestionType;

													// Update both form state AND local state for immediate UI reactivity
													field.handleChange(newType);
													setCurrentQuestionType(newType);

													// Reset options when type changes
													if (newType === QUESTION_TYPES.TRUE_FALSE) {
														setOptions([
															{ text: 'True', isCorrect: false, order: 0 },
															{ text: 'False', isCorrect: false, order: 1 },
														]);
													} else if (questionTypeRequiresOptions(newType)) {
														// Compatible types - preserve options when switching between single/multiple choice
														const compatibleTypes: QuestionType[] = [
															QUESTION_TYPES.SINGLE_CHOICE,
															QUESTION_TYPES.MULTIPLE_CHOICE,
														];
														const wasCompatible = compatibleTypes.includes(prevType);
														const isCompatible = compatibleTypes.includes(newType);

														if (!(wasCompatible && isCompatible)) {
															setOptions([
																{ text: '', isCorrect: false, order: 0 },
																{ text: '', isCorrect: false, order: 1 },
															]);
														}
													}
												}}
											>
												<SelectTrigger id="type">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{Object.entries(QUESTION_TYPES).map(([, value]) => (
														<SelectItem key={value} value={value}>
															{questionTypeLabels[value]}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
								</form.Field>

								<form.Field name="difficulty">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="difficulty">Difficulty</Label>
											<Select
												value={field.state.value}
												onValueChange={(value) => field.handleChange(value as QuestionDifficulty)}
											>
												<SelectTrigger id="difficulty">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{Object.entries(QUESTION_DIFFICULTY).map(
														([, value]) => (
															<SelectItem key={value} value={value}>
																{difficultyLabels[value]}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										</div>
									)}
								</form.Field>

								<form.Field name="points">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor="points">Points</Label>
											<Input
												id="points"
												type="number"
												min={0}
												step={0.5}
												value={field.state.value}
												onChange={(e) =>
													field.handleChange(
														Number.parseFloat(e.target.value) || 0
													)
												}
												onBlur={field.handleBlur}
											/>
										</div>
									)}
								</form.Field>

								{currentQuestionType === QUESTION_TYPES.MULTIPLE_CHOICE && (
									<form.Field name="allowPartialCredit">
										{(field) => (
											<div className="space-y-2">
												<Label>Partial Credit</Label>
												<div className="flex items-center space-x-2 pt-2">
													<Switch
														id="allowPartialCredit"
														checked={field.state.value}
														onCheckedChange={field.handleChange}
													/>
													<Label htmlFor="allowPartialCredit" className="font-normal">
														{field.state.value ? 'Enabled' : 'Disabled'}
													</Label>
												</div>
												<p className="text-muted-foreground text-xs">
													Award points for partially correct answers
												</p>
											</div>
										)}
									</form.Field>
								)}

								{/* Curriculum Hierarchy - Cascading Comboboxes */}
								<div className="space-y-4">
									<Label className="text-sm font-medium">Link to Curriculum (optional)</Label>
									<p className="text-muted-foreground text-xs -mt-2">
										Select a subject, then chapter, section, and optionally a lesson
									</p>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Subject</Label>
										<Combobox
											options={subjects?.map((s) => ({ value: s._id, label: s.name })) ?? []}
											value={subjectId}
											onValueChange={(id) => {
												setSubjectId(id);
												setChapterId(undefined);
												setSectionId(undefined);
												form.setFieldValue('lessonId', undefined);
											}}
											placeholder="Select subject..."
											searchPlaceholder="Search subjects..."
											emptyText="No subjects found"
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Chapter</Label>
										<Combobox
											options={chapters?.map((c) => ({ value: c._id, label: c.name })) ?? []}
											value={chapterId}
											onValueChange={(id) => {
												setChapterId(id);
												setSectionId(undefined);
												form.setFieldValue('lessonId', undefined);
											}}
											placeholder={subjectId ? 'Select chapter...' : 'Select subject first'}
											searchPlaceholder="Search chapters..."
											emptyText="No chapters found"
											disabled={!subjectId}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Section</Label>
										<Combobox
											options={sections?.map((s) => ({ value: s._id, label: s.name })) ?? []}
											value={sectionId}
											onValueChange={(id) => {
												setSectionId(id);
												form.setFieldValue('lessonId', undefined);
											}}
											placeholder={chapterId ? 'Select section...' : 'Select chapter first'}
											searchPlaceholder="Search sections..."
											emptyText="No sections found"
											disabled={!chapterId}
										/>
									</div>

									<form.Field name="lessonId">
										{(field) => (
											<div className="space-y-2">
												<Label className="text-xs text-muted-foreground">Lesson</Label>
												<Combobox
													options={lessons?.map((l) => ({ value: l._id, label: l.title })) ?? []}
													value={field.state.value}
													onValueChange={field.handleChange}
													placeholder={sectionId ? 'Select lesson (optional)...' : 'Select section first'}
													searchPlaceholder="Search lessons..."
													emptyText="No lessons found"
													disabled={!sectionId}
												/>
												<p className="text-muted-foreground text-xs">
													Link to a lesson for "Learn More" on incorrect answers
												</p>
											</div>
										)}
									</form.Field>
								</div>

								<form.Field name="isActive">
									{(field) => (
										<div className="space-y-2">
											<Label>Status</Label>
											<div className="flex items-center space-x-2 pt-2">
												<Switch
													id="isActive"
													checked={field.state.value}
													onCheckedChange={field.handleChange}
												/>
												<Label htmlFor="isActive" className="font-normal">
													{field.state.value ? 'Published' : 'Draft'}
												</Label>
											</div>
										</div>
									)}
								</form.Field>
							</CardContent>
						</Card>

						<div className="flex gap-4">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => navigate({ to: '/admin/questions', search: { limit: 20, type: 'all', difficulty: 'all' } })}
							>
								Cancel
							</Button>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										className="flex-1"
										disabled={!canSubmit || isSubmitting}
									>
										{isSubmitting ? 'Creating...' : 'Create Question'}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
