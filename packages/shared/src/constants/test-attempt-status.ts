import { z } from 'zod';

/**
 * Test attempt status constants
 * Defines the possible states of a test attempt
 */
export const TEST_ATTEMPT_STATUS = {
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
	ABANDONED: 'abandoned',
} as const;

/**
 * Union type of all test attempt statuses
 */
export type TestAttemptStatus = (typeof TEST_ATTEMPT_STATUS)[keyof typeof TEST_ATTEMPT_STATUS];

/**
 * Array of all test attempt status values (for Zod enum)
 */
export const TEST_ATTEMPT_STATUS_VALUES = Object.values(TEST_ATTEMPT_STATUS);

/**
 * Zod enum schema for test attempt status
 */
export const testAttemptStatusEnum = z.enum([
	TEST_ATTEMPT_STATUS.IN_PROGRESS,
	TEST_ATTEMPT_STATUS.COMPLETED,
	TEST_ATTEMPT_STATUS.ABANDONED,
]);
