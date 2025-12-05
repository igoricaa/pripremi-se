import {
	submitAnswerResponseSchema,
	getAnswerResponseSchema,
	listAttemptResponsesSchema,
	listQuestionResponsesSchema,
} from '@pripremi-se/shared';
import type { Id } from './_generated/dataModel';
import { authedZodMutation, authedZodQuery, zodQuery, createTimestamps, updateTimestamp } from './lib';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single answer response by ID.
 * Requires authentication - users can only view responses from their own attempts.
 */
export const getResponse = authedZodQuery({
	args: getAnswerResponseSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const responseId = args.id as Id<'answerResponses'>;

		const response = await db.get(responseId);
		if (!response) {
			return null;
		}

		// Verify the response belongs to an attempt owned by the user
		const attempt = await db.get(response.attemptId);
		if (!attempt || attempt.userId !== user._id) {
			throw new Error('Not authorized to view this response');
		}

		return response;
	},
});

/**
 * Get all responses for a specific attempt.
 * Requires authentication - users can only view their own attempt responses.
 */
export const getAttemptResponses = authedZodQuery({
	args: listAttemptResponsesSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const attemptId = args.attemptId as Id<'testAttempts'>;

		// Verify the attempt belongs to the user
		const attempt = await db.get(attemptId);
		if (!attempt) {
			throw new Error('Attempt not found');
		}
		if (attempt.userId !== user._id) {
			throw new Error('Not authorized to view responses for this attempt');
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
 * Public query - no authentication required.
 */
export const getQuestionResponses = zodQuery({
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
 * Requires authentication.
 */
export const submitResponse = authedZodMutation({
	args: submitAnswerResponseSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const attemptId = args.attemptId as Id<'testAttempts'>;
		const questionId = args.questionId as Id<'questions'>;

		// Verify the attempt belongs to the user
		const attempt = await db.get(attemptId);
		if (!attempt) {
			throw new Error('Attempt not found');
		}
		if (attempt.userId !== user._id) {
			throw new Error('Not authorized to submit responses for this attempt');
		}

		// Check if a response already exists for this question in this attempt
		const existingResponse = await db
			.query('answerResponses')
			.withIndex('by_attemptId_questionId', (q) => q.eq('attemptId', attemptId).eq('questionId', questionId))
			.first();

		if (existingResponse) {
			// Update existing response
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

		// Create new response
		const responseId = await db.insert('answerResponses', {
			attemptId,
			questionId,
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
