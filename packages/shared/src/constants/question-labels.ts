import { QUESTION_TYPES } from './question-types';
import { QUESTION_DIFFICULTY } from './question-difficulty';

/**
 * Human-readable labels for question types
 * Used for UI display purposes
 */
export const questionTypeLabels: Record<string, string> = {
	[QUESTION_TYPES.SINGLE_CHOICE]: 'Single Choice',
	[QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
	[QUESTION_TYPES.TRUE_FALSE]: 'True/False',
	[QUESTION_TYPES.SHORT_ANSWER]: 'Short Answer',
	[QUESTION_TYPES.ESSAY]: 'Essay',
};

/**
 * Human-readable labels for question difficulty levels
 * Used for UI display purposes
 */
export const difficultyLabels: Record<string, string> = {
	[QUESTION_DIFFICULTY.EASY]: 'Easy',
	[QUESTION_DIFFICULTY.MEDIUM]: 'Medium',
	[QUESTION_DIFFICULTY.HARD]: 'Hard',
};

