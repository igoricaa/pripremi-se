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
	editorZodMutation,
	editorZodQuery,
	query,
	slugify,
	generateUniqueSlug,
	handleSlugUpdate,
	createTimestamps,
	updateTimestamp,
} from './lib';
import { DatabaseWriter } from './_generated/server';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all lessons (admin view), sorted by order.
 * Requires editor or admin role.
 */
export const listLessons = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;
		const lessons = await db.query('lessons').withIndex('by_sectionId_order').collect();
		return lessons;
	},
});

/**
 * List all lessons with full hierarchy (section, chapter, subject).
 * Single query replaces 4 separate queries (lessons + sections + chapters + subjects).
 * Includes hierarchy data for filter dropdowns.
 * Requires editor or admin role.
 */
export const listLessonsWithHierarchy = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;

		// Fetch all data in parallel
		const [lessons, sections, chapters, subjects] = await Promise.all([
			db.query('lessons').withIndex('by_sectionId_order').collect(),
			db.query('sections').withIndex('by_chapterId_order').collect(),
			db.query('chapters').withIndex('by_subjectId_order').collect(),
			db.query('subjects').withIndex('by_order').collect(),
		]);

		// Create lookup maps server-side
		const sectionMap = new Map(sections.map((s) => [s._id, s]));
		const chapterMap = new Map(chapters.map((c) => [c._id, c]));
		const subjectMap = new Map(subjects.map((s) => [s._id, s]));

		// Enrich lessons with hierarchy info
		const enrichedLessons = lessons.map((lesson) => {
			const section = sectionMap.get(lesson.sectionId);
			const chapter = section ? chapterMap.get(section.chapterId) : null;
			const subject = chapter ? subjectMap.get(chapter.subjectId) : null;
			return {
				...lesson,
				sectionName: section?.name ?? null,
				chapterName: chapter?.name ?? null,
				subjectName: subject?.name ?? null,
			};
		});

		// Return enriched lessons + hierarchy for filter dropdown
		return {
			lessons: enrichedLessons,
			hierarchy: { subjects, chapters, sections },
		};
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
 * Requires editor or admin role.
 */
export const getLessonById = editorZodQuery({
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
 * Requires editor or admin role.
 * Also updates totalLessons in all affected sectionProgress records.
 */
export const createLesson = editorZodMutation({
	args: createLessonSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		const baseSlug = args.slug || slugify(args.title);
		const uniqueSlug = await generateUniqueSlug(db, 'lessons', baseSlug);
		const sectionId = args.sectionId as Id<'sections'>;

		const lessonId = await db.insert('lessons', {
			sectionId,
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

		// Sync totalLessons in all sectionProgress records for this section
		if (args.isActive) {
			await syncSectionProgressTotalLessons(db, sectionId);
		}

		return lessonId;
	},
});

/**
 * Update an existing lesson.
 * If title is changed and slug is not provided, slug is regenerated.
 * Requires editor or admin role.
 * Also syncs totalLessons if isActive changes.
 */
export const updateLesson = editorZodMutation({
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

		// Sync totalLessons if isActive changed
		if (otherUpdates.isActive !== undefined && otherUpdates.isActive !== existing.isActive) {
			await syncSectionProgressTotalLessons(db, existing.sectionId);
		}

		return lessonId;
	},
});

/**
 * Delete a lesson.
 * WARNING: This is a hard delete.
 * Requires editor or admin role.
 * Also updates totalLessons in all affected sectionProgress records.
 */
export const deleteLesson = editorZodMutation({
	args: deleteLessonSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const lessonId = args.id as Id<'lessons'>;

		const existing = await db.get(lessonId);
		if (!existing) {
			throw new Error('Lesson not found');
		}

		const sectionId = existing.sectionId;
		const wasActive = existing.isActive;

		await db.delete(lessonId);

		// Sync totalLessons in all sectionProgress records for this section
		if (wasActive) {
			await syncSectionProgressTotalLessons(db, sectionId);
		}

		return { success: true };
	},
});

/**
 * Bulk update lesson order values.
 * Used for drag-and-drop reordering in admin UI.
 * Requires editor or admin role.
 */
export const reorderLessons = editorZodMutation({
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


/**
 * Sync totalLessons in all sectionProgress records for a section.
 * Called when lessons are created, updated (isActive changes), or deleted.
 */
async function syncSectionProgressTotalLessons(
  db: DatabaseWriter,
  sectionId: Id<'sections'>
): Promise<void> {
  const allProgress = await db
    .query('sectionProgress')
    .withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId))
    .collect();

  if (allProgress.length === 0) return;

  const allLessons = await db
    .query('lessons')
    .withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId))
    .collect();
  
  const totalLessons = allLessons.filter((l) => l.isActive).length;

  await Promise.all(
    allProgress.map((progress) =>
      db.patch(progress._id, { totalLessons, ...updateTimestamp() })
    )
  );
}