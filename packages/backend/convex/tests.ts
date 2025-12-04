import {
	createTestSchema,
	updateTestSchema,
	getTestByIdSchema,
	deleteTestSchema,
	reorderTestsSchema,
} from '@pripremi-se/shared';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { query } from './_generated/server';
import {
	authedZodMutation,
	authedZodQuery,
	slugify,
	generateUniqueSlug,
	handleSlugUpdate,
	createTimestamps,
	updateTimestamp,
} from './lib';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all tests (admin view), sorted by order.
 * Requires authentication.
 */
export const listTests = authedZodQuery({
	args: {},
	handler: async (ctx) => {
		const tests = await ctx.db.query('tests').withIndex('by_order').collect();
		return tests;
	},
});

/**
 * List only active (published) tests, sorted by order.
 * Public query - no authentication required.
 */
export const listActiveTests = query({
	args: {},
	handler: async (ctx) => {
		const tests = await ctx.db
			.query('tests')
			.withIndex('by_isActive_order', (q) => q.eq('isActive', true))
			.collect();
		return tests;
	},
});

/**
 * List active tests for a specific subject.
 * Public query - no authentication required.
 */
export const listTestsBySubject = query({
	args: { subjectId: v.id('subjects') },
	handler: async (ctx, args) => {
		return ctx.db
			.query('tests')
			.withIndex('by_isActive_subjectId', (q) => q.eq('isActive', true).eq('subjectId', args.subjectId))
			.collect();
	},
});

/**
 * List active tests for a specific chapter.
 * Public query - no authentication required.
 */
export const listTestsByChapter = query({
	args: { chapterId: v.id('chapters') },
	handler: async (ctx, args) => {
		return ctx.db
			.query('tests')
			.withIndex('by_isActive_chapterId', (q) => q.eq('isActive', true).eq('chapterId', args.chapterId))
			.collect();
	},
});

/**
 * List active tests for a specific section.
 * Public query - no authentication required.
 */
export const listTestsBySection = query({
	args: { sectionId: v.id('sections') },
	handler: async (ctx, args) => {
		return ctx.db
			.query('tests')
			.withIndex('by_isActive_sectionId', (q) => q.eq('isActive', true).eq('sectionId', args.sectionId))
			.collect();
	},
});

/**
 * Get a single test by its slug.
 * Public query - no authentication required.
 */
export const getTestBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const test = await ctx.db.query('tests').withIndex('by_slug', (q) => q.eq('slug', args.slug)).first();
		return test;
	},
});

/**
 * Get a single test by its ID.
 * Requires authentication (admin view).
 */
export const getTestById = authedZodQuery({
	args: getTestByIdSchema,
	handler: async (ctx, args) => {
		const test = await ctx.db.get(args.id as Id<'tests'>);
		return test;
	},
});

/**
 * Get a test with all its linked questions (via junction table).
 * Requires authentication (admin view).
 */
// TODO: Check if this can be optimized using some convex-helpers functions or generally be better written.
export const getTestWithQuestions = authedZodQuery({
	args: getTestByIdSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const testId = args.id as Id<'tests'>;

		const test = await db.get(testId);
		if (!test) {
			return null;
		}

		// Get linked questions via junction table
		const testQuestions = await db
			.query('testQuestions')
			.withIndex('by_testId_order', (q) => q.eq('testId', testId))
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
		const validQuestions = questions.filter((q) => q !== null);

		return {
			...test,
			questions: validQuestions,
		};
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new test.
 * Slug is auto-generated from title if not provided.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const createTest = authedZodMutation({
	args: createTestSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Generate slug from title if not provided
		const baseSlug = args.slug || slugify(args.title);
		const uniqueSlug = await generateUniqueSlug(db, 'tests', baseSlug);

		const { slug, subjectId, chapterId, sectionId, ...data } = args;

		const testId = await db.insert('tests', {
			...data,
			slug: uniqueSlug,
			subjectId: subjectId ? (subjectId as Id<'subjects'>) : undefined,
			chapterId: chapterId ? (chapterId as Id<'chapters'>) : undefined,
			sectionId: sectionId ? (sectionId as Id<'sections'>) : undefined,
			...createTimestamps(),
		});

		return testId;
	},
});

/**
 * Update an existing test.
 * If title is changed and slug is not provided, slug is regenerated.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const updateTest = authedZodMutation({
	args: updateTestSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, slug, subjectId, chapterId, sectionId, ...otherUpdates } = args;
		const testId = id as Id<'tests'>;

		const existing = await db.get(testId);
		if (!existing) {
			throw new Error('Test not found');
		}

		const updateData: Record<string, unknown> = {
			...updateTimestamp(),
		};

		// Update regular fields
		for (const [key, value] of Object.entries(otherUpdates)) {
			if (value !== undefined) {
				updateData[key] = value === null ? undefined : value;
			}
		}

		// Handle curriculum linking updates
		if (subjectId !== undefined) {
			updateData.subjectId = subjectId ? (subjectId as Id<'subjects'>) : undefined;
		}
		if (chapterId !== undefined) {
			updateData.chapterId = chapterId ? (chapterId as Id<'chapters'>) : undefined;
		}
		if (sectionId !== undefined) {
			updateData.sectionId = sectionId ? (sectionId as Id<'sections'>) : undefined;
		}

		// Handle slug update
		const newSlug = await handleSlugUpdate(db, 'tests', {
			slug,
			newName: otherUpdates.title,
			existingName: existing.title,
			excludeId: testId,
		});

		if (newSlug !== undefined) {
			updateData.slug = newSlug;
		}

		await db.patch(testId, updateData);

		return testId;
	},
});

/**
 * Delete a test.
 * WARNING: This is a hard delete. Consider implications for linked questions.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const deleteTest = authedZodMutation({
	args: deleteTestSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const testId = args.id as Id<'tests'>;

		const existing = await db.get(testId);
		if (!existing) {
			throw new Error('Test not found');
		}

		// Check for linked questions before deletion (via junction table)
		const hasLinkedQuestions = await db.query('testQuestions').withIndex('by_testId', (q) => q.eq('testId', testId)).first();

		if (hasLinkedQuestions) {
			throw new Error('Cannot delete test with linked questions. Unlink all questions first.');
		}

		await db.delete(testId);

		return { success: true };
	},
});

/**
 * Bulk update test order values.
 * Used for drag-and-drop reordering in admin UI.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const reorderTests = authedZodMutation({
	args: reorderTestsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { items } = args;

		await Promise.all(
			items.map(async (item) => {
				const testId = item.id as Id<'tests'>;
				await db.patch(testId, {
					order: item.order,
					...updateTimestamp(),
				});
			})
		);

		return { success: true };
	},
});
