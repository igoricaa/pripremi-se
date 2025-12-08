import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
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
import { toast } from 'sonner';
import { QuestionOptionsEditor, type QuestionOption } from '@/components/admin/QuestionOptionsEditor';
import { CurriculumSelector } from '@/components/admin/CurriculumSelector';
import { useCurriculumHierarchy } from '@/hooks/use-curriculum-hierarchy';
import { validateQuestionOptions } from '@/lib/validations/question-validation';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin/questions/new')({
	component: NewQuestionPage,
});

function NewQuestionPage() {
	const navigate = useNavigate();
	const createQuestionWithOptions = useMutation(api.questions.createQuestionWithOptions);

	// Curriculum hierarchy hook
	const curriculum = useCurriculumHierarchy();

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
				if (!validateQuestionOptions(questionType, options)) {
					return;
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
				navigate({ to: '/admin/questions' });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to create question'
				);
			}
		},
	});

	// Use local state for UI reactivity (form.state.values.type is not reactive outside form.Field)
	const needsOptions = questionTypeRequiresOptions(currentQuestionType);

	// Connect curriculum hook to form for cascading resets
	useEffect(() => {
		curriculum.setResetLessonCallback(() => {
			form.setFieldValue('lessonId', undefined);
		});
	}, [curriculum, form]);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link 
						to="/admin/questions" 
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

								<form.Field name="lessonId">
									{(field) => (
										<CurriculumSelector
											subjectId={curriculum.subjectId}
											chapterId={curriculum.chapterId}
											sectionId={curriculum.sectionId}
											lessonId={field.state.value}
											onSubjectChange={curriculum.setSubjectId}
											onChapterChange={curriculum.setChapterId}
											onSectionChange={curriculum.setSectionId}
											onLessonChange={field.handleChange}
											subjects={curriculum.subjects}
											chapters={curriculum.chapters}
											sections={curriculum.sections}
											lessons={curriculum.lessons}
										/>
									)}
								</form.Field>

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
								asChild
							>
								<Link to="/admin/questions">
									Cancel
								</Link>
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
