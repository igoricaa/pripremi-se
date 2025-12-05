import {
	submitAnswerResponseSchema,
	getAnswerResponseSchema,
	listAttemptResponsesSchema,
	listQuestionResponsesSchema,
} from '@pripremi-se/shared';
import type { Id } from './_generated/dataModel';
import { authedZodMutation, authedZodQuery, adminZodQuery, createTimestamps, updateTimestamp } from './lib';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single answer response by ID.
 * Requires authentication - ownership enforced by RLS.
 */
export const getResponse = authedZodQuery({
	args: getAnswerResponseSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const responseId = args.id as Id<'answerResponses'>;

		return db.get(responseId);
	},
});

/**
 * Get all responses for a specific attempt.
 * Requires authentication - ownership enforced by RLS.
 */
export const getAttemptResponses = authedZodQuery({
	args: listAttemptResponsesSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const attemptId = args.attemptId as Id<'testAttempts'>;

		const attempt = await db.get(attemptId);
		if (!attempt) {
			throw new Error('Attempt not found');
		}

		const responses = await db
			.query('answerResponses')
			.withIndex('by_attemptId', (q) => q.eq('attemptId', attemptId))
			.collect();

		return responses;
	},
});

/**
 * Get all responses for a specific question (for analytics).
 * Admin-only query - protects user data.
 */
export const getQuestionResponses = adminZodQuery({
	args: listQuestionResponsesSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const questionId = args.questionId as Id<'questions'>;
		const limit = args.limit ?? 50;

		const responses = await db
			.query('answerResponses')
			.withIndex('by_questionId', (q) => q.eq('questionId', questionId))
			.take(limit);

		return responses;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Submit an answer response for a question.
 * Requires authentication - ownership enforced by RLS.
 */
export const submitResponse = authedZodMutation({
	args: submitAnswerResponseSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const attemptId = args.attemptId as Id<'testAttempts'>;
		const questionId = args.questionId as Id<'questions'>;

		const attempt = await db.get(attemptId);
		if (!attempt) {
			throw new Error('Attempt not found');
		}

		const existingResponse = await db
			.query('answerResponses')
			.withIndex('by_attemptId_questionId', (q) => q.eq('attemptId', attemptId).eq('questionId', questionId))
			.first();

		if (existingResponse) {
			await db.patch(existingResponse._id, {
				selectedOptionIds: args.selectedOptionIds as Id<'questionOptions'>[] | undefined,
				textAnswer: args.textAnswer,
				isCorrect: args.isCorrect,
				pointsEarned: args.pointsEarned,
				timeSpent: args.timeSpent,
				...updateTimestamp(),
			});
			return existingResponse._id;
		}

		const responseId = await db.insert('answerResponses', {
			attemptId,
			questionId,
			userId: user._id,
			selectedOptionIds: args.selectedOptionIds as Id<'questionOptions'>[] | undefined,
			textAnswer: args.textAnswer,
			isCorrect: args.isCorrect,
			pointsEarned: args.pointsEarned,
			timeSpent: args.timeSpent,
			...createTimestamps(),
		});

		return responseId;
	},
});
