import {
	startTestAttemptSchema,
	updateTestAttemptSchema,
	completeTestAttemptSchema,
	abandonTestAttemptSchema,
	getTestAttemptSchema,
	listUserTestAttemptsSchema,
	getUserActiveAttemptSchema,
	getTestLeaderboardSchema,
	getUserAttemptCountSchema,
	TEST_ATTEMPT_STATUS,
	SECTION_PROGRESS_STATUS,
} from '@pripremi-se/shared';
import type { Id } from './_generated/dataModel';
import { authedZodMutation, authedZodQuery, zodQuery, createTimestamps, updateTimestamp } from './lib';
import { now } from './lib/timestamps';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single test attempt by ID.
 * Requires authentication - users can only view their own attempts.
 */
export const getAttempt = authedZodQuery({
	args: getTestAttemptSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const attemptId = args.id as Id<'testAttempts'>;

		const attempt = await db.get(attemptId);
		if (!attempt) {
			return null;
		}

		// Users can only view their own attempts
		if (attempt.userId !== user._id) {
			throw new Error('Not authorized to view this attempt');
		}

		return attempt;
	},
});

/**
 * List user's test attempts with optional filters.
 * Requires authentication.
 */
export const getUserAttempts = authedZodQuery({
	args: listUserTestAttemptsSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const { testId, status } = args;

		// If filtering by testId, use the composite index
		if (testId) {
			const attempts = await db
				.query('testAttempts')
				.withIndex('by_userId_testId', (q) => q.eq('userId', user._id).eq('testId', testId as Id<'tests'>))
				.collect();

			// Apply status filter if provided
			if (status) {
				return attempts.filter((a) => a.status === status);
			}
			return attempts;
		}

		// If filtering by status only, use userId_status index
		if (status) {
			return db
				.query('testAttempts')
				.withIndex('by_userId_status', (q) => q.eq('userId', user._id).eq('status', status))
				.collect();
		}

		// Default: all attempts for user
		return db.query('testAttempts').withIndex('by_userId', (q) => q.eq('userId', user._id)).collect();
	},
});

/**
 * Get user's active (in_progress) attempt for a specific test.
 * Used for resume functionality.
 * Requires authentication.
 */
export const getUserActiveAttempt = authedZodQuery({
	args: getUserActiveAttemptSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const testId = args.testId as Id<'tests'>;

		const attempt = await db
			.query('testAttempts')
			.withIndex('by_userId_testId', (q) => q.eq('userId', user._id).eq('testId', testId))
			.filter((q) => q.eq(q.field('status'), TEST_ATTEMPT_STATUS.IN_PROGRESS))
			.first();

		return attempt;
	},
});

/**
 * Get user's attempt count for a specific test.
 * Used for enforcing maxAttempts limit.
 * Requires authentication.
 */
export const getUserAttemptCount = authedZodQuery({
	args: getUserAttemptCountSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const testId = args.testId as Id<'tests'>;

		const attempts = await db
			.query('testAttempts')
			.withIndex('by_userId_testId', (q) => q.eq('userId', user._id).eq('testId', testId))
			.collect();

		return {
			total: attempts.length,
			completed: attempts.filter((a) => a.status === TEST_ATTEMPT_STATUS.COMPLETED).length,
			inProgress: attempts.filter((a) => a.status === TEST_ATTEMPT_STATUS.IN_PROGRESS).length,
			abandoned: attempts.filter((a) => a.status === TEST_ATTEMPT_STATUS.ABANDONED).length,
		};
	},
});

/**
 * Get test leaderboard (top scores).
 * Public query - no authentication required.
 */
export const getTestLeaderboard = zodQuery({
	args: getTestLeaderboardSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const testId = args.testId as Id<'tests'>;
		const limit = args.limit ?? 10;

		// Get completed attempts sorted by score (descending)
		// Note: Convex doesn't support ORDER BY DESC on index, so we need to fetch and sort in memory
		const attempts = await db
			.query('testAttempts')
			.withIndex('by_testId', (q) => q.eq('testId', testId))
			.filter((q) => q.eq(q.field('status'), TEST_ATTEMPT_STATUS.COMPLETED))
			.collect();

		// Sort by score descending, then by timeSpent ascending (faster is better)
		const sortedAttempts = attempts
			.sort((a, b) => {
				if (b.score !== a.score) {
					return b.score - a.score;
				}
				return a.timeSpent - b.timeSpent;
			})
			.slice(0, limit);

		return sortedAttempts;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Start a new test attempt.
 * Validates test existence and maxAttempts limit.
 * Checks for existing in_progress attempt.
 * Requires authentication.
 */
export const startAttempt = authedZodMutation({
	args: startTestAttemptSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const testId = args.testId as Id<'tests'>;

		// Verify test exists and is active
		const test = await db.get(testId);
		if (!test) {
			throw new Error('Test not found');
		}
		if (!test.isActive) {
			throw new Error('Test is not available');
		}

		// Check for existing in_progress attempt
		const existingAttempt = await db
			.query('testAttempts')
			.withIndex('by_userId_testId', (q) => q.eq('userId', user._id).eq('testId', testId))
			.filter((q) => q.eq(q.field('status'), TEST_ATTEMPT_STATUS.IN_PROGRESS))
			.first();

		if (existingAttempt) {
			throw new Error('You already have an in-progress attempt for this test. Please complete or abandon it first.');
		}

		// Check maxAttempts limit
		if (test.maxAttempts) {
			const completedAttempts = await db
				.query('testAttempts')
				.withIndex('by_userId_testId', (q) => q.eq('userId', user._id).eq('testId', testId))
				.filter((q) => q.eq(q.field('status'), TEST_ATTEMPT_STATUS.COMPLETED))
				.collect();

			if (completedAttempts.length >= test.maxAttempts) {
				throw new Error(`Maximum attempts (${test.maxAttempts}) reached for this test`);
			}
		}

		// Get total questions count for this test
		const testQuestions = await db.query('testQuestions').withIndex('by_testId', (q) => q.eq('testId', testId)).collect();

		const totalQuestions = testQuestions.length;
		if (totalQuestions === 0) {
			throw new Error('Test has no questions');
		}

		// Create new attempt
		const currentTime = now();
		const attemptId = await db.insert('testAttempts', {
			userId: user._id,
			testId,
			score: 0,
			correctCount: 0,
			totalQuestions,
			timeSpent: 0,
			status: TEST_ATTEMPT_STATUS.IN_PROGRESS,
			startedAt: currentTime,
			...createTimestamps(),
		});

		return attemptId;
	},
});

/**
 * Update an in-progress attempt (e.g., tracking time spent).
 * Requires authentication.
 */
export const updateAttempt = authedZodMutation({
	args: updateTestAttemptSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const attemptId = args.id as Id<'testAttempts'>;

		const attempt = await db.get(attemptId);
		if (!attempt) {
			throw new Error('Attempt not found');
		}

		// Users can only update their own attempts
		if (attempt.userId !== user._id) {
			throw new Error('Not authorized to update this attempt');
		}

		// Can only update in_progress attempts
		if (attempt.status !== TEST_ATTEMPT_STATUS.IN_PROGRESS) {
			throw new Error('Can only update in-progress attempts');
		}

		await db.patch(attemptId, {
			timeSpent: args.timeSpent,
			...updateTimestamp(),
		});

		return attemptId;
	},
});

/**
 * Complete a test attempt with final score.
 * Requires authentication.
 * Also updates section progress if test is linked to a section.
 */
export const completeAttempt = authedZodMutation({
	args: completeTestAttemptSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const attemptId = args.id as Id<'testAttempts'>;

		const attempt = await db.get(attemptId);
		if (!attempt) {
			throw new Error('Attempt not found');
		}

		// Users can only complete their own attempts
		if (attempt.userId !== user._id) {
			throw new Error('Not authorized to complete this attempt');
		}

		// Can only complete in_progress attempts
		if (attempt.status !== TEST_ATTEMPT_STATUS.IN_PROGRESS) {
			throw new Error('Can only complete in-progress attempts');
		}

		const currentTime = now();
		await db.patch(attemptId, {
			score: args.score,
			correctCount: args.correctCount,
			totalQuestions: args.totalQuestions,
			timeSpent: args.timeSpent,
			status: TEST_ATTEMPT_STATUS.COMPLETED,
			completedAt: currentTime,
			...updateTimestamp(),
		});

		// Sync section progress if test is linked to a section
		const test = await db.get(attempt.testId);
		if (test?.sectionId) {
			const sectionProgress = await db
				.query('sectionProgress')
				.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', test.sectionId as Id<'sections'>))
				.first();

			if (sectionProgress) {
				const passed = args.score >= test.passingScore;
				const updateData: Record<string, unknown> = {
					testPassed: passed || sectionProgress.testPassed, // Once passed, stays passed
					bestTestScore: Math.max(args.score, sectionProgress.bestTestScore ?? 0),
					...updateTimestamp(),
				};

				// Auto-complete section if all lessons done and test now passed
				if (passed && sectionProgress.lessonsCompleted >= sectionProgress.totalLessons && sectionProgress.totalLessons > 0) {
					updateData.status = SECTION_PROGRESS_STATUS.COMPLETED;
					updateData.completedAt = currentTime;
				}

				await db.patch(sectionProgress._id, updateData);
			}
		}

		return attemptId;
	},
});

/**
 * Abandon a test attempt.
 * Requires authentication.
 */
export const abandonAttempt = authedZodMutation({
	args: abandonTestAttemptSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const attemptId = args.id as Id<'testAttempts'>;

		const attempt = await db.get(attemptId);
		if (!attempt) {
			throw new Error('Attempt not found');
		}

		// Users can only abandon their own attempts
		if (attempt.userId !== user._id) {
			throw new Error('Not authorized to abandon this attempt');
		}

		// Can only abandon in_progress attempts
		if (attempt.status !== TEST_ATTEMPT_STATUS.IN_PROGRESS) {
			throw new Error('Can only abandon in-progress attempts');
		}

		const currentTime = now();
		await db.patch(attemptId, {
			status: TEST_ATTEMPT_STATUS.ABANDONED,
			completedAt: currentTime,
			...(args.timeSpent !== undefined && { timeSpent: args.timeSpent }),
			...updateTimestamp(),
		});

		return attemptId;
	},
});
