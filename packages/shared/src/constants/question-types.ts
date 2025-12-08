import { z } from 'zod';

/**
 * Question type constants
 * Defines all supported question types in the system
 */
export const QUESTION_TYPES = {
	SINGLE_CHOICE: 'single_choice',
	MULTIPLE_CHOICE: 'multiple_choice',
	TRUE_FALSE: 'true_false',
	SHORT_ANSWER: 'short_answer',
	ESSAY: 'essay',
} as const;

/**
 * Union type of all question types
 */
export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

/**
 * Array of all question type values (for Zod enum)
 */
export const QUESTION_TYPE_VALUES = Object.values(QUESTION_TYPES);

/**
 * Zod enum schema for question types
 */
export const questionTypeEnum = z.enum([
	QUESTION_TYPES.SINGLE_CHOICE,
	QUESTION_TYPES.MULTIPLE_CHOICE,
	QUESTION_TYPES.TRUE_FALSE,
	QUESTION_TYPES.SHORT_ANSWER,
	QUESTION_TYPES.ESSAY,
]);

/**
 * Question types that require answer options
 */
export const QUESTION_TYPES_WITH_OPTIONS: readonly QuestionType[] = [
	QUESTION_TYPES.SINGLE_CHOICE,
	QUESTION_TYPES.MULTIPLE_CHOICE,
	QUESTION_TYPES.TRUE_FALSE,
];

/**
 * Check if a question type requires answer options
 */
export function questionTypeRequiresOptions(type: QuestionType): boolean {
	return (QUESTION_TYPES_WITH_OPTIONS as readonly string[]).includes(type);
}
