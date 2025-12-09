import { QUESTION_TYPES, questionTypeRequiresOptions, type QuestionType } from '@pripremi-se/shared';
import { toast } from 'sonner';
import type { QuestionOption } from '@/components/admin/QuestionOptionsEditor';

/**
 * Validates question options based on question type.
 * Shows toast error messages for validation failures.
 * @returns true if valid, false if invalid
 */
export function validateQuestionOptions(
	questionType: QuestionType,
	options: QuestionOption[]
): boolean {
	const needsOptions = questionTypeRequiresOptions(questionType);

	if (!needsOptions) {
		return true;
	}

	const correctCount = options.filter((o) => o.isCorrect).length;

	if (questionType === QUESTION_TYPES.SINGLE_CHOICE || questionType === QUESTION_TYPES.TRUE_FALSE) {
		if (correctCount !== 1) {
			toast.error('Please select exactly one correct answer');
			return false;
		}
	} else if (questionType === QUESTION_TYPES.MULTIPLE_CHOICE) {
		if (correctCount < 1) {
			toast.error('Please select at least one correct answer');
			return false;
		}
	}

	// Validate option text (skip for true/false which has predefined text)
	const emptyOptions = options.filter((o) => !o.text.trim());
	if (emptyOptions.length > 0 && questionType !== QUESTION_TYPES.TRUE_FALSE) {
		toast.error('Please fill in all option texts');
		return false;
	}

	return true;
}
