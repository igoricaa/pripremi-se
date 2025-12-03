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
 * List all sections (admin view), sorted by order.
 * Requires authentication.
 */
export const listSections = authedZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;
		const sections = await db.query('sections').withIndex('by_chapterId_order').collect();
		return sections;
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
 * Requires authentication (admin view).
 */
export const getSectionById = authedZodQuery({
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
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const createSection = authedZodMutation({
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
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const updateSection = authedZodMutation({
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
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const deleteSection = authedZodMutation({
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
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const reorderSections = authedZodMutation({
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
