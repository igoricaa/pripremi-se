import {
	linkQuestionToTestSchema,
	unlinkQuestionFromTestSchema,
	reorderTestQuestionsSchema,
	listTestsForQuestionSchema,
} from '@pripremi-se/shared';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { editorZodMutation, editorZodQuery } from './lib';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all questions for a specific test, sorted by order (via junction table).
 * Public query - returns questions with their options.
 */
export const listQuestionsByTest = query({
	args: { testId: v.id('tests') },
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Get linked questions via junction table
		const testQuestions = await db
			.query('testQuestions')
			.withIndex('by_testId_order', (q) => q.eq('testId', args.testId))
			.collect();

		// Fetch full question details with options
		const questions = await Promise.all(
			testQuestions.map(async (tq) => {
				const question = await db.get(tq.questionId);
				if (!question) return null;

				const options = await db
					.query('questionOptions')
					.withIndex('by_questionId_order', (q) => q.eq('questionId', tq.questionId))
					.collect();

				return {
					...question,
					order: tq.order, // Order from junction table
					options,
				};
			})
		);

		// Filter out any null questions (deleted questions)
		return questions.filter((q) => q !== null);
	},
});

/**
 * List all tests that contain a specific question (via junction table).
 * Requires editor or admin role.
 */
export const listTestsForQuestion = editorZodQuery({
	args: listTestsForQuestionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Get linked tests via junction table
		const testQuestions = await db
			.query('testQuestions')
			.withIndex('by_questionId', (q) => q.eq('questionId', args.questionId as Id<'questions'>))
			.collect();

		// Fetch full test details
		const tests = await Promise.all(
			testQuestions.map(async (tq) => {
				const test = await db.get(tq.testId);
				if (!test) return null;

				return {
					...test,
					order: tq.order, // Order of this question in the test
				};
			})
		);

		// Filter out any null tests (deleted tests)
		return tests.filter((t) => t !== null);
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Link an existing question to a test with a specific order.
 * Requires editor or admin role.
 */
export const linkQuestionToTest = editorZodMutation({
	args: linkQuestionToTestSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { testId, questionId, order } = args;

		// Validate that test exists
		const test = await db.get(testId as Id<'tests'>);
		if (!test) {
			throw new Error('Test not found');
		}

		// Validate that question exists
		const question = await db.get(questionId as Id<'questions'>);
		if (!question) {
			throw new Error('Question not found');
		}

		// Check if already linked (prevent duplicates)
		const existing = await db
			.query('testQuestions')
			.withIndex('by_testId_questionId', (q) => q.eq('testId', testId as Id<'tests'>).eq('questionId', questionId as Id<'questions'>))
			.first();

		if (existing) {
			throw new Error('Question is already linked to this test');
		}

		// Prevent linking inactive questions
		if (!question.isActive) {
			throw new Error('Cannot link inactive questions to tests');
		}

		// Create junction record
		const linkId = await db.insert('testQuestions', {
			testId: testId as Id<'tests'>,
			questionId: questionId as Id<'questions'>,
			order,
			createdAt: Date.now(),
		});

		return linkId;
	},
});

/**
 * Unlink a question from a test.
 * Requires editor or admin role.
 */
export const unlinkQuestionFromTest = editorZodMutation({
	args: unlinkQuestionFromTestSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { testId, questionId } = args;

		// Find the junction record
		const link = await db
			.query('testQuestions')
			.withIndex('by_testId_questionId', (q) => q.eq('testId', testId as Id<'tests'>).eq('questionId', questionId as Id<'questions'>))
			.first();

		if (!link) {
			throw new Error('Question is not linked to this test');
		}

		// Delete junction record
		await db.delete(link._id);

		return { success: true };
	},
});

/**
 * Bulk update question order values within a test.
 * Used for drag-and-drop reordering in admin UI.
 * Requires editor or admin role.
 */
export const reorderQuestionsInTest = editorZodMutation({
	args: reorderTestQuestionsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { testId, items } = args;

		// Validate that test exists
		const test = await db.get(testId as Id<'tests'>);
		if (!test) {
			throw new Error('Test not found');
		}

		// Update order for each question
		await Promise.all(
			items.map(async (item) => {
				const link = await db
					.query('testQuestions')
					.withIndex('by_testId_questionId', (q) =>
						q.eq('testId', testId as Id<'tests'>).eq('questionId', item.questionId as Id<'questions'>)
					)
					.first();

				if (!link) {
					throw new Error(`Question ${item.questionId} is not linked to test ${testId}`);
				}

				await db.patch(link._id, {
					order: item.order,
				});
			})
		);

		return { success: true };
	},
});
