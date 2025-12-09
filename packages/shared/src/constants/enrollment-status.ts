import { z } from 'zod';

/**
 * Student enrollment status constants
 * Defines the possible states of a student's subject enrollment
 */
export const ENROLLMENT_STATUS = {
	ACTIVE: 'active',
	COMPLETED: 'completed',
	PAUSED: 'paused',
} as const;

/**
 * Union type of all enrollment statuses
 */
export type EnrollmentStatus =
	(typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

/**
 * Array of all enrollment status values (for Zod enum)
 */
export const ENROLLMENT_STATUS_VALUES = Object.values(ENROLLMENT_STATUS);

/**
 * Zod enum schema for enrollment status
 */
export const enrollmentStatusEnum = z.enum([
	ENROLLMENT_STATUS.ACTIVE,
	ENROLLMENT_STATUS.COMPLETED,
	ENROLLMENT_STATUS.PAUSED,
]);
