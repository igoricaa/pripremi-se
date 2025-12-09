import { z } from 'zod';

/**
 * Question difficulty constants
 * Defines difficulty levels for categorizing questions
 */
export const QUESTION_DIFFICULTY = {
	EASY: 'easy',
	MEDIUM: 'medium',
	HARD: 'hard',
} as const;

/**
 * Union type of all question difficulty levels
 */
export type QuestionDifficulty =
	(typeof QUESTION_DIFFICULTY)[keyof typeof QUESTION_DIFFICULTY];

/**
 * Array of all question difficulty values (for Zod enum)
 */
export const QUESTION_DIFFICULTY_VALUES = Object.values(QUESTION_DIFFICULTY);

/**
 * Zod enum schema for question difficulty
 */
export const questionDifficultyEnum = z.enum([
	QUESTION_DIFFICULTY.EASY,
	QUESTION_DIFFICULTY.MEDIUM,
	QUESTION_DIFFICULTY.HARD,
]);
