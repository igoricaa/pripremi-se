import { z } from 'zod';

/**
 * Lesson progress status constants
 * Defines the possible states of a user's lesson progress
 */
export const LESSON_PROGRESS_STATUS = {
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
} as const;

/**
 * Union type of all lesson progress statuses
 */
export type LessonProgressStatus =
	(typeof LESSON_PROGRESS_STATUS)[keyof typeof LESSON_PROGRESS_STATUS];

/**
 * Array of all lesson progress status values (for Zod enum)
 */
export const LESSON_PROGRESS_STATUS_VALUES = Object.values(
	LESSON_PROGRESS_STATUS
);

/**
 * Zod enum schema for lesson progress status
 */
export const lessonProgressStatusEnum = z.enum([
	LESSON_PROGRESS_STATUS.IN_PROGRESS,
	LESSON_PROGRESS_STATUS.COMPLETED,
]);
