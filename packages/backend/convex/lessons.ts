import {
	createLessonSchema,
	updateLessonSchema,
	getLessonByIdSchema,
	deleteLessonSchema,
	reorderLessonsSchema,
} from '@pripremi-se/shared';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import {
	authedZodMutation,
	authedZodQuery,
	query,
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
 * List all lessons (admin view), sorted by order.
 * Requires authentication.
 */
export const listLessons = authedZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;
		const lessons = await db.query('lessons').withIndex('by_sectionId_order').collect();
		return lessons;
	},
});

/**
 * List all lessons for a specific section, sorted by order.
 * Public query - no authentication required.
 */
export const listLessonsBySection = query({
	args: { sectionId: v.id('sections') },
	handler: async (ctx, args) => {
		return ctx.db
			.query('lessons')
			.withIndex('by_sectionId_order', (q) => q.eq('sectionId', args.sectionId))
			.collect();
	},
});

/**
 * List only active (published) lessons, sorted by order.
 * Public query - no authentication required.
 */
export const listActiveLessons = query({
	args: {},
	handler: async (ctx) => {
		const lessons = await ctx.db
			.query('lessons')
			.withIndex('by_isActive_order', (q) => q.eq('isActive', true))
			.collect();

		return lessons;
	},
});

/**
 * List active lessons for a specific section, sorted by order.
 * Public query - no authentication required.
 */
export const listActiveLessonsBySection = query({
	args: { sectionId: v.id('sections') },
	handler: async (ctx, args) => {
		return ctx.db
			.query('lessons')
			.withIndex('by_isActive_sectionId_order', (q) =>
				q.eq('isActive', true).eq('sectionId', args.sectionId)
			)
			.collect();
	},
});

/**
 * Get a single lesson by its slug.
 * Public query - no authentication required.
 */
export const getLessonBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const lesson = await ctx.db
			.query('lessons')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.first();
		return lesson;
	},
});

/**
 * Get a single lesson by its ID.
 * Requires authentication (admin view).
 */
export const getLessonById = authedZodQuery({
	args: getLessonByIdSchema,
	handler: async (ctx, args) => {
		const lesson = await ctx.db.get(args.id as Id<'lessons'>);
		return lesson;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new lesson.
 * Slug is auto-generated from title if not provided.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const createLesson = authedZodMutation({
	args: createLessonSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		const baseSlug = args.slug || slugify(args.title);
		const uniqueSlug = await generateUniqueSlug(db, 'lessons', baseSlug);

		const lessonId = await db.insert('lessons', {
			sectionId: args.sectionId as Id<'sections'>,
			title: args.title,
			slug: uniqueSlug,
			content: args.content,
			contentType: args.contentType,
			estimatedMinutes: args.estimatedMinutes,
			practiceTestId: args.practiceTestId ? (args.practiceTestId as Id<'tests'>) : undefined,
			order: args.order,
			isActive: args.isActive,
			...createTimestamps(),
		});

		return lessonId;
	},
});

/**
 * Update an existing lesson.
 * If title is changed and slug is not provided, slug is regenerated.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const updateLesson = authedZodMutation({
	args: updateLessonSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, slug, practiceTestId, ...otherUpdates } = args;
		const lessonId = id as Id<'lessons'>;

		const existing = await db.get(lessonId);
		if (!existing) {
			throw new Error('Lesson not found');
		}

		const updateData: Record<string, unknown> = {
			...updateTimestamp(),
		};

		// Handle practiceTestId explicitly
		if (practiceTestId !== undefined) {
			updateData.practiceTestId = practiceTestId ? (practiceTestId as Id<'tests'>) : undefined;
		}

		// Handle other fields
		for (const [key, value] of Object.entries(otherUpdates)) {
			if (value !== undefined) {
				updateData[key] = value === null ? undefined : value;
			}
		}

		const newSlug = await handleSlugUpdate(db, 'lessons', {
			slug,
			newName: otherUpdates.title,
			existingName: existing.title,
			excludeId: lessonId,
		});

		if (newSlug !== undefined) {
			updateData.slug = newSlug;
		}

		await db.patch(lessonId, updateData);

		return lessonId;
	},
});

/**
 * Delete a lesson.
 * WARNING: This is a hard delete.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const deleteLesson = authedZodMutation({
	args: deleteLessonSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const lessonId = args.id as Id<'lessons'>;

		const existing = await db.get(lessonId);
		if (!existing) {
			throw new Error('Lesson not found');
		}

		await db.delete(lessonId);

		return { success: true };
	},
});

/**
 * Bulk update lesson order values.
 * Used for drag-and-drop reordering in admin UI.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const reorderLessons = authedZodMutation({
	args: reorderLessonsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { items } = args;

		await Promise.all(
			items.map(async (item) => {
				const lessonId = item.id as Id<'lessons'>;
				await db.patch(lessonId, {
					order: item.order,
					...updateTimestamp(),
				});
			})
		);

		return { success: true };
	},
});
