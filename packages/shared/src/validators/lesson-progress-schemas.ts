import { z } from 'zod';
import { lessonProgressStatusEnum } from '../constants/lesson-progress-status';

// Schema for starting/initializing lesson progress (on first access)
export const startLessonProgressSchema = z.object({
	lessonId: z.string().min(1, 'Lesson ID is required'),
});

export type StartLessonProgressInput = z.infer<
	typeof startLessonProgressSchema
>;

// Schema for updating lesson progress (e.g., tracking time spent)
export const updateLessonProgressSchema = z.object({
	id: z.string().min(1, 'Progress ID is required'),
	timeSpent: z
		.number()
		.int('Time spent must be an integer')
		.min(0, 'Time spent must be 0 or greater'),
});

export type UpdateLessonProgressInput = z.infer<
	typeof updateLessonProgressSchema
>;

// Schema for completing a lesson
export const completeLessonProgressSchema = z.object({
	id: z.string().min(1, 'Progress ID is required'),
	timeSpent: z
		.number()
		.int('Time spent must be an integer')
		.min(0, 'Time spent must be 0 or greater')
		.optional(),
});

export type CompleteLessonProgressInput = z.infer<
	typeof completeLessonProgressSchema
>;

// Schema for getting a single lesson progress by ID
export const getLessonProgressSchema = z.object({
	id: z.string().min(1, 'Progress ID is required'),
});

export type GetLessonProgressInput = z.infer<typeof getLessonProgressSchema>;

// Schema for getting user's progress for a specific lesson
export const getUserLessonProgressSchema = z.object({
	lessonId: z.string().min(1, 'Lesson ID is required'),
});

export type GetUserLessonProgressInput = z.infer<
	typeof getUserLessonProgressSchema
>;

// Schema for listing user's lesson progress with optional filters
export const listUserLessonProgressSchema = z.object({
	status: lessonProgressStatusEnum.optional(),
});

export type ListUserLessonProgressInput = z.infer<
	typeof listUserLessonProgressSchema
>;
