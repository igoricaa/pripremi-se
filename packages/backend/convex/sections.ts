import {
	createSectionSchema,
	updateSectionSchema,
	getSectionByIdSchema,
	deleteSectionSchema,
	reorderSectionsSchema,
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

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all sections (admin view), sorted by order.
 * Requires editor or admin role.
 */
export const listSections = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;
		const sections = await db.query('sections').withIndex('by_chapterId_order').collect();
		return sections;
	},
});

/**
 * List all sections with full hierarchy (chapter, subject).
 * Single query replaces 3 separate queries (sections + chapters + subjects).
 * Includes hierarchy data for filter dropdowns.
 * Requires editor or admin role.
 */
export const listSectionsWithHierarchy = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;

		// Fetch all data in parallel
		const [sections, chapters, subjects] = await Promise.all([
			db.query('sections').withIndex('by_chapterId_order').collect(),
			db.query('chapters').withIndex('by_subjectId_order').collect(),
			db.query('subjects').withIndex('by_order').collect(),
		]);

		// Create lookup maps server-side
		const chapterMap = new Map(chapters.map((c) => [c._id, c]));
		const subjectMap = new Map(subjects.map((s) => [s._id, s]));

		// Enrich sections with hierarchy info
		const enrichedSections = sections.map((section) => {
			const chapter = chapterMap.get(section.chapterId);
			const subject = chapter ? subjectMap.get(chapter.subjectId) : null;
			return {
				...section,
				chapterName: chapter?.name ?? null,
				subjectName: subject?.name ?? null,
			};
		});

		// Return enriched sections + hierarchy for filter dropdown
		return {
			sections: enrichedSections,
			hierarchy: { subjects, chapters },
		};
	},
});

/**
 * List all sections for a specific chapter, sorted by order.
 * Public query - no authentication required.
 */
export const listSectionsByChapter = query({
	args: { chapterId: v.id('chapters') },
	handler: async (ctx, args) => {
		return ctx.db
			.query('sections')
			.withIndex('by_chapterId_order', (q) => q.eq('chapterId', args.chapterId))
			.collect();
	},
});

/**
 * List only active (published) sections, sorted by order.
 * Public query - no authentication required.
 */
export const listActiveSections = query({
	args: {},
	handler: async (ctx) => {
		const sections = await ctx.db
			.query('sections')
			.withIndex('by_isActive_order', (q) => q.eq('isActive', true))
			.collect();

		return sections;
	},
});

/**
 * List active sections for a specific chapter, sorted by order.
 * Public query - no authentication required.
 */
export const listActiveSectionsByChapter = query({
	args: { chapterId: v.id('chapters') },
	handler: async (ctx, args) => {
		return ctx.db
			.query('sections')
			.withIndex('by_isActive_chapterId_order', (q) =>
				q.eq('isActive', true).eq('chapterId', args.chapterId)
			)
			.collect();
	},
});

/**
 * Get a single section by its slug.
 * Public query - no authentication required.
 */
export const getSectionBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const section = await ctx.db
			.query('sections')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.first();
		return section;
	},
});

/**
 * Get a single section by its ID.
 * Requires editor or admin role.
 */
export const getSectionById = editorZodQuery({
	args: getSectionByIdSchema,
	handler: async (ctx, args) => {
		const section = await ctx.db.get(args.id as Id<'sections'>);
		return section;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new section.
 * Slug is auto-generated from name if not provided.
 * Requires editor or admin role.
 */
export const createSection = editorZodMutation({
	args: createSectionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		const baseSlug = args.slug || slugify(args.name);
		const uniqueSlug = await generateUniqueSlug(db, 'sections', baseSlug);

		const sectionId = await db.insert('sections', {
			chapterId: args.chapterId as Id<'chapters'>,
			name: args.name,
			slug: uniqueSlug,
			description: args.description,
			order: args.order,
			isActive: args.isActive,
			...createTimestamps(),
		});

		return sectionId;
	},
});

/**
 * Update an existing section.
 * If name is changed and slug is not provided, slug is regenerated.
 * Requires editor or admin role.
 */
export const updateSection = editorZodMutation({
	args: updateSectionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, slug, ...otherUpdates } = args;
		const sectionId = id as Id<'sections'>;

		const existing = await db.get(sectionId);
		if (!existing) {
			throw new Error('Section not found');
		}

		const updateData: Record<string, unknown> = {
			...updateTimestamp(),
		};

		for (const [key, value] of Object.entries(otherUpdates)) {
			if (value !== undefined) {
				updateData[key] = value === null ? undefined : value;
			}
		}

		const newSlug = await handleSlugUpdate(db, 'sections', {
			slug,
			newName: otherUpdates.name,
			existingName: existing.name,
			excludeId: sectionId,
		});

		if (newSlug !== undefined) {
			updateData.slug = newSlug;
		}

		await db.patch(sectionId, updateData);

		return sectionId;
	},
});

/**
 * Delete a section.
 * WARNING: This is a hard delete. Consider implications for child entities (lessons).
 * Requires editor or admin role.
 */
export const deleteSection = editorZodMutation({
	args: deleteSectionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const sectionId = args.id as Id<'sections'>;

		const existing = await db.get(sectionId);
		if (!existing) {
			throw new Error('Section not found');
		}

		// Check for child lessons before deletion
		const hasChildren = await db
			.query('lessons')
			.withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId))
			.first();
		if (hasChildren) {
			throw new Error('Cannot delete section with existing lessons. Delete all lessons first.');
		}

		await db.delete(sectionId);

		return { success: true };
	},
});

/**
 * Bulk update section order values.
 * Used for drag-and-drop reordering in admin UI.
 * Requires editor or admin role.
 */
export const reorderSections = editorZodMutation({
	args: reorderSectionsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { items } = args;

		await Promise.all(
			items.map(async (item) => {
				const sectionId = item.id as Id<'sections'>;
				await db.patch(sectionId, {
					order: item.order,
					...updateTimestamp(),
				});
			})
		);

		return { success: true };
	},
});
