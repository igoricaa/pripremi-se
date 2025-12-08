import {
	createQuestionSchema,
	updateQuestionSchema,
	getQuestionByIdSchema,
	deleteQuestionSchema,
	createQuestionOptionSchema,
	updateQuestionOptionSchema,
	deleteQuestionOptionSchema,
	createQuestionWithOptionsSchema,
	QUESTION_TYPES,
} from '@pripremi-se/shared';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { editorZodMutation, editorZodQuery, createTimestamps, updateTimestamp } from './lib';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate that question options match the question type requirements.
 */
function validateQuestionOptions(
	type: string,
	options: Array<{ text: string; isCorrect: boolean; order: number }>
): void {
	const correctCount = options.filter((o) => o.isCorrect).length;

	if (type === QUESTION_TYPES.SINGLE_CHOICE || type === QUESTION_TYPES.TRUE_FALSE) {
		if (options.length === 0) {
			throw new Error('Single choice and true/false questions must have options');
		}
		if (correctCount !== 1) {
			throw new Error('Single choice and true/false questions must have exactly one correct answer');
		}
		if (type === QUESTION_TYPES.TRUE_FALSE && options.length !== 2) {
			throw new Error('True/false questions must have exactly 2 options');
		}
	} else if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
		if (options.length === 0) {
			throw new Error('Multiple choice questions must have options');
		}
		if (correctCount < 1) {
			throw new Error('Multiple choice questions must have at least one correct answer');
		}
	} else if (type === QUESTION_TYPES.SHORT_ANSWER || type === QUESTION_TYPES.ESSAY) {
		if (options.length > 0) {
			throw new Error('Text-based questions (short answer/essay) should not have options');
		}
	}
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all questions (for admin panel).
 * Returns ALL questions regardless of status.
 * Requires editor or admin role.
 */
export const listQuestions = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('questions').collect();
	},
});

/**
 * Optimized query for admin questions table.
 * Returns truncated questions + full hierarchy for filtering.
 * Requires editor or admin role.
 */
export const listQuestionsForAdmin = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;

		// Fetch all data in parallel
		const [questions, lessons, sections, chapters, subjects] = await Promise.all([
			db.query('questions').order('desc').collect(),
			db.query('lessons').withIndex('by_sectionId_order').collect(),
			db.query('sections').withIndex('by_chapterId_order').collect(),
			db.query('chapters').withIndex('by_subjectId_order').collect(),
			db.query('subjects').withIndex('by_order').collect(),
		]);

		// Create lookup maps
		const lessonMap = new Map(lessons.map((l) => [l._id, l]));
		const sectionMap = new Map(sections.map((s) => [s._id, s]));
		const chapterMap = new Map(chapters.map((c) => [c._id, c]));

		// Return truncated questions for table display
		const tableQuestions = questions.map((q) => {
			const lesson = q.lessonId ? lessonMap.get(q.lessonId) : null;
			const section = lesson ? sectionMap.get(lesson.sectionId) : null;
			const chapter = section ? chapterMap.get(section.chapterId) : null;

			return {
				_id: q._id,
				text: q.text.length > 100 ? q.text.substring(0, 100) + '...' : q.text,
				type: q.type,
				difficulty: q.difficulty,
				points: q.points,
				lessonId: q.lessonId,
				// Hierarchy IDs for filtering
				sectionId: section?._id ?? null,
				chapterId: chapter?._id ?? null,
				subjectId: chapter?.subjectId ?? null,
				// Display names
				lessonTitle: lesson?.title ?? null,
			};
		});

		return {
			questions: tableQuestions,
			hierarchy: { subjects, chapters, sections, lessons },
		};
	},
});

/**
 * Get a single question with its options.
 * Public query - no authentication required.
 */
export const getQuestionWithOptions = query({
	args: { questionId: v.id('questions') },
	handler: async (ctx, args) => {
		const question = await ctx.db.get(args.questionId);
		if (!question) return null;

		const options = await ctx.db
			.query('questionOptions')
			.withIndex('by_questionId_order', (q) => q.eq('questionId', args.questionId))
			.collect();

		return { ...question, options };
	},
});

/**
 * Get a single question by ID (admin view).
 * Requires editor or admin role.
 */
export const getQuestionById = editorZodQuery({
	args: getQuestionByIdSchema,
	handler: async (ctx, args) => {
		const question = await ctx.db.get(args.id as Id<'questions'>);
		return question;
	},
});

/**
 * List options for a specific question.
 * Public query - no authentication required.
 */
export const listQuestionOptions = query({
	args: { questionId: v.id('questions') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('questionOptions')
			.withIndex('by_questionId_order', (q) => q.eq('questionId', args.questionId))
			.collect();
	},
});

// ============================================================================
// MUTATIONS - QUESTIONS
// ============================================================================

export const createQuestion = editorZodMutation({
	args: createQuestionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		
		const questionId = await db.insert('questions', {
			...args,
			lessonId: args.lessonId ? (args.lessonId as Id<'lessons'>) : undefined,
			...createTimestamps(),
		});
		return questionId;
	}
})

/**
 * Create a question with its options in a single transaction.
 * This is the preferred way to create questions.
 * Requires editor or admin role.
 */
export const createQuestionWithOptions = editorZodMutation({
	args: createQuestionWithOptionsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { question, options } = args;

		// Validate question type vs options
		validateQuestionOptions(question.type, options);

		// Create question (simplified - no testId/isShared)
		const questionId = await db.insert('questions', {
			...question,
			lessonId: question.lessonId ? (question.lessonId as Id<'lessons'>) : undefined,
			...createTimestamps(),
		});

		// Create options
		await Promise.all(
			options.map((option) =>
				db.insert('questionOptions', {
					questionId,
					...option,
					createdAt: Date.now(),
				})
			)
		);

		return questionId;
	},
});

/**
 * Update an existing question.
 * Requires editor or admin role.
 */
export const updateQuestion = editorZodMutation({
	args: updateQuestionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, ...updates } = args;
		const questionId = id as Id<'questions'>;

		const existing = await db.get(questionId);
		if (!existing) {
			throw new Error('Question not found');
		}

		const updateData: Record<string, unknown> = {
			...updateTimestamp(),
		};

		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				updateData[key] = value === null ? undefined : value;
			}
		}

		await db.patch(questionId, updateData);

		return questionId;
	},
});

/**
 * Delete a question and all its options.
 * WARNING: This is a hard delete. Consider implications for linked tests and user answers.
 * Requires editor or admin role.
 */
export const deleteQuestion = editorZodMutation({
	args: deleteQuestionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const questionId = args.id as Id<'questions'>;

		const existing = await db.get(questionId);
		if (!existing) {
			throw new Error('Question not found');
		}

		// Delete all test-question links and options (cascade)
		const [testQuestionLinks, options] = await Promise.all([
			db
				.query('testQuestions')
				.withIndex('by_questionId', (q) => q.eq('questionId', questionId))
				.collect(),
			db
				.query('questionOptions')
				.withIndex('by_questionId', (q) => q.eq('questionId', questionId))
				.collect()
		]);

		await Promise.all([
			...testQuestionLinks.map((link) => db.delete(link._id)),
			...options.map((opt) => db.delete(opt._id))
		]);

		// Delete question
		await db.delete(questionId);

		return { success: true };
	},
});

// ============================================================================
// MUTATIONS - QUESTION OPTIONS
// ============================================================================

/**
 * Create a new option for an existing question.
 * Requires editor or admin role.
 */
export const createQuestionOption = editorZodMutation({
	args: createQuestionOptionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { questionId, ...data } = args;

		const optionId = await db.insert('questionOptions', {
			questionId: questionId as Id<'questions'>,
			...data,
			createdAt: Date.now(),
		});

		return optionId;
	},
});

/**
 * Update an existing question option.
 * Requires editor or admin role.
 */
export const updateQuestionOption = editorZodMutation({
	args: updateQuestionOptionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, ...updates } = args;
		const optionId = id as Id<'questionOptions'>;

		const existing = await db.get(optionId);
		if (!existing) {
			throw new Error('Question option not found');
		}

		const updateData: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				updateData[key] = value;
			}
		}

		await db.patch(optionId, updateData);

		return optionId;
	},
});

/**
 * Delete a question option.
 * Requires editor or admin role.
 */
export const deleteQuestionOption = editorZodMutation({
	args: deleteQuestionOptionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const optionId = args.id as Id<'questionOptions'>;

		const existing = await db.get(optionId);
		if (!existing) {
			throw new Error('Question option not found');
		}

		await db.delete(optionId);

		return { success: true };
	},
});
