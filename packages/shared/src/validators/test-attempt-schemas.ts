import { z } from 'zod';
import { testAttemptStatusEnum } from '../constants/test-attempt-status';

// Schema for starting a new test attempt
export const startTestAttemptSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
});

export type StartTestAttemptInput = z.infer<typeof startTestAttemptSchema>;

// Schema for updating an in-progress attempt (e.g., tracking time spent)
export const updateTestAttemptSchema = z.object({
	id: z.string().min(1, 'Attempt ID is required'),
	timeSpent: z
		.number()
		.int('Time spent must be an integer')
		.min(0, 'Time spent must be 0 or greater'),
});

export type UpdateTestAttemptInput = z.infer<typeof updateTestAttemptSchema>;

// Schema for completing a test attempt
export const completeTestAttemptSchema = z.object({
	id: z.string().min(1, 'Attempt ID is required'),
	score: z
		.number()
		.min(0, 'Score must be at least 0')
		.max(100, 'Score must be at most 100'),
	correctCount: z
		.number()
		.int('Correct count must be an integer')
		.min(0, 'Correct count must be 0 or greater'),
	totalQuestions: z
		.number()
		.int('Total questions must be an integer')
		.min(1, 'Total questions must be at least 1'),
	timeSpent: z
		.number()
		.int('Time spent must be an integer')
		.min(0, 'Time spent must be 0 or greater'),
});

export type CompleteTestAttemptInput = z.infer<
	typeof completeTestAttemptSchema
>;

// Schema for abandoning a test attempt
export const abandonTestAttemptSchema = z.object({
	id: z.string().min(1, 'Attempt ID is required'),
	timeSpent: z
		.number()
		.int('Time spent must be an integer')
		.min(0, 'Time spent must be 0 or greater')
		.optional(),
});

export type AbandonTestAttemptInput = z.infer<typeof abandonTestAttemptSchema>;

// Schema for getting a single test attempt by ID
export const getTestAttemptSchema = z.object({
	id: z.string().min(1, 'Attempt ID is required'),
});

export type GetTestAttemptInput = z.infer<typeof getTestAttemptSchema>;

// Schema for listing user's test attempts with optional filters
export const listUserTestAttemptsSchema = z.object({
	testId: z.string().min(1, 'Test ID is required').optional(),
	status: testAttemptStatusEnum.optional(),
});

export type ListUserTestAttemptsInput = z.infer<
	typeof listUserTestAttemptsSchema
>;

// Schema for getting user's active (in_progress) attempt for a specific test
export const getUserActiveAttemptSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
});

export type GetUserActiveAttemptInput = z.infer<
	typeof getUserActiveAttemptSchema
>;

// Schema for getting test leaderboard
export const getTestLeaderboardSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
	limit: z.number().int('Limit must be an integer').min(1).max(100).default(10),
});

export type GetTestLeaderboardInput = z.infer<typeof getTestLeaderboardSchema>;

// Schema for getting user's attempt count for a specific test
export const getUserAttemptCountSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
});

export type GetUserAttemptCountInput = z.infer<
	typeof getUserAttemptCountSchema
>;
