import { z } from 'zod';
import { sectionProgressStatusEnum } from '../constants/section-progress-status';

// ============================================================================
// MUTATION SCHEMAS
// ============================================================================

/**
 * Schema for starting section progress (when user first accesses section)
 */
export const startSectionProgressSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
});

export type StartSectionProgressInput = z.infer<
	typeof startSectionProgressSchema
>;

/**
 * Schema for updating lesson counts (called when lesson progress changes)
 */
export const updateLessonCountSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
	lessonsCompleted: z
		.number()
		.int('Lessons completed must be an integer')
		.min(0),
	totalLessons: z.number().int('Total lessons must be an integer').min(0),
});

export type UpdateLessonCountInput = z.infer<typeof updateLessonCountSchema>;

/**
 * Schema for updating test result (called when test attempt completes)
 */
export const updateTestResultSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
	passed: z.boolean(),
	score: z
		.number()
		.min(0, 'Score must be at least 0')
		.max(100, 'Score must be at most 100'),
});

export type UpdateTestResultInput = z.infer<typeof updateTestResultSchema>;

/**
 * Schema for updating last accessed timestamp
 */
export const updateSectionLastAccessedSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
});

export type UpdateSectionLastAccessedInput = z.infer<
	typeof updateSectionLastAccessedSchema
>;

/**
 * Schema for completing section progress
 */
export const completeSectionProgressSchema = z.object({
	id: z.string().min(1, 'Progress ID is required'),
});

export type CompleteSectionProgressInput = z.infer<
	typeof completeSectionProgressSchema
>;

/**
 * Schema for recalculating section progress (manual sync)
 */
export const recalculateSectionProgressSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
});

export type RecalculateSectionProgressInput = z.infer<
	typeof recalculateSectionProgressSchema
>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for getting section progress by ID
 */
export const getSectionProgressByIdSchema = z.object({
	id: z.string().min(1, 'Progress ID is required'),
});

export type GetSectionProgressByIdInput = z.infer<
	typeof getSectionProgressByIdSchema
>;

/**
 * Schema for getting user's progress for a specific section
 */
export const getUserSectionProgressSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
});

export type GetUserSectionProgressInput = z.infer<
	typeof getUserSectionProgressSchema
>;

/**
 * Schema for listing user's section progress with optional status filter
 */
export const listUserSectionProgressSchema = z.object({
	status: sectionProgressStatusEnum.optional(),
});

export type ListUserSectionProgressInput = z.infer<
	typeof listUserSectionProgressSchema
>;

/**
 * Schema for getting chapter-level progress (aggregate of all sections)
 */
export const getChapterProgressSchema = z.object({
	chapterId: z.string().min(1, 'Chapter ID is required'),
});

export type GetChapterProgressInput = z.infer<typeof getChapterProgressSchema>;

/**
 * Schema for getting section progress statistics (admin)
 */
export const getSectionProgressStatsSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
});

export type GetSectionProgressStatsInput = z.infer<
	typeof getSectionProgressStatsSchema
>;
