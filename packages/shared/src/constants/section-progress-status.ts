import { z } from 'zod';

/**
 * Section progress status constants
 * Defines the possible states of a student's section progress
 */
export const SECTION_PROGRESS_STATUS = {
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
} as const;

/**
 * Union type of all section progress statuses
 */
export type SectionProgressStatus = (typeof SECTION_PROGRESS_STATUS)[keyof typeof SECTION_PROGRESS_STATUS];

/**
 * Array of all section progress status values (for Zod enum)
 */
export const SECTION_PROGRESS_STATUS_VALUES = Object.values(SECTION_PROGRESS_STATUS);

/**
 * Zod enum schema for section progress status
 */
export const sectionProgressStatusEnum = z.enum([
	SECTION_PROGRESS_STATUS.IN_PROGRESS,
	SECTION_PROGRESS_STATUS.COMPLETED,
]);
