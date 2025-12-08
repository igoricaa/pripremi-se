import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { QUESTION_TYPES } from '@pripremi-se/shared';

export interface QuestionOption {
	text: string;
	isCorrect: boolean;
	order: number;
}

interface QuestionOptionsEditorProps {
	questionType: string;
	options: QuestionOption[];
	onChange: (options: QuestionOption[]) => void;
}

export function QuestionOptionsEditor({
	questionType,
	options,
	onChange,
}: QuestionOptionsEditorProps) {
	// True/False questions have fixed options
	const isTrueFalse = questionType === QUESTION_TYPES.TRUE_FALSE;
	const isSingleChoice = questionType === QUESTION_TYPES.SINGLE_CHOICE;
	const isMultipleChoice = questionType === QUESTION_TYPES.MULTIPLE_CHOICE;

	// Initialize true/false options if needed
	if (isTrueFalse && options.length !== 2) {
		onChange([
			{ text: 'True', isCorrect: false, order: 0 },
			{ text: 'False', isCorrect: false, order: 1 },
		]);
		return null; // Will re-render with correct options
	}

	const handleOptionTextChange = (index: number, text: string) => {
		const newOptions = [...options];
		newOptions[index] = { ...newOptions[index], text };
		onChange(newOptions);
	};

	const handleCorrectChange = (index: number, isCorrect: boolean) => {
		const newOptions = [...options];

		if (isSingleChoice || isTrueFalse) {
			// For single choice, only one can be correct
			newOptions.forEach((opt, i) => {
				newOptions[i] = { ...opt, isCorrect: i === index };
			});
		} else {
			// For multiple choice, toggle the selected one
			newOptions[index] = { ...newOptions[index], isCorrect };
		}

		onChange(newOptions);
	};

	const handleAddOption = () => {
		const newOption: QuestionOption = {
			text: '',
			isCorrect: false,
			order: options.length,
		};
		onChange([...options, newOption]);
	};

	const handleRemoveOption = (index: number) => {
		if (options.length <= 2) return; // Minimum 2 options
		const newOptions = options.filter((_, i) => i !== index);
		// Reorder remaining options
		const reorderedOptions = newOptions.map((opt, i) => ({
			...opt,
			order: i,
		}));
		onChange(reorderedOptions);
	};

	const correctCount = options.filter((o) => o.isCorrect).length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Answer Options</Label>
				{!isTrueFalse && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddOption}
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Option
					</Button>
				)}
			</div>

			<div className="space-y-2">
				{options.map((option, index) => (
					<div
						key={index}
						className="flex items-center gap-3 rounded-md border bg-muted/30 p-3"
					>
						{!isTrueFalse && (
							<GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
						)}

						{isSingleChoice || isTrueFalse ? (
							<input
								type="radio"
								name="correct-answer"
								checked={option.isCorrect}
								onChange={() => handleCorrectChange(index, true)}
								className="h-4 w-4"
							/>
						) : (
							<Checkbox
								checked={option.isCorrect}
								onCheckedChange={(checked) =>
									handleCorrectChange(index, checked === true)
								}
							/>
						)}

						{isTrueFalse ? (
							<span className="flex-1 font-medium">{option.text}</span>
						) : (
							<Input
								value={option.text}
								onChange={(e) => handleOptionTextChange(index, e.target.value)}
								placeholder={`Option ${index + 1}`}
								className="flex-1"
							/>
						)}

						{!isTrueFalse && options.length > 2 && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => handleRemoveOption(index)}
								className="shrink-0"
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">Remove option</span>
							</Button>
						)}
					</div>
				))}
			</div>

			{/* Validation hints */}
			<div className="text-muted-foreground text-sm">
				{isSingleChoice && correctCount !== 1 && (
					<p className="text-destructive">Select exactly one correct answer</p>
				)}
				{isTrueFalse && correctCount !== 1 && (
					<p className="text-destructive">Select the correct answer</p>
				)}
				{isMultipleChoice && correctCount < 1 && (
					<p className="text-destructive">Select at least one correct answer</p>
				)}
				{isSingleChoice && correctCount === 1 && (
					<p className="text-green-600">1 correct answer selected</p>
				)}
				{isMultipleChoice && correctCount >= 1 && (
					<p className="text-green-600">{correctCount} correct answer(s) selected</p>
				)}
			</div>
		</div>
	);
}
