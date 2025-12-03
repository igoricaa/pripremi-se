import { createChapterSchema, deleteChapterSchema, getChapterByIdSchema, reorderChaptersSchema, updateChapterSchema } from "@pripremi-se/shared";
import { authedZodMutation, authedZodQuery, createTimestamps, generateUniqueSlug, handleSlugUpdate, query, slugify, updateTimestamp } from "./lib";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all chapters (admin view), sorted by order.
 * Requires authentication.
 */
export const listChapters = authedZodQuery({
    args: {},
    handler: async (ctx) => {
        const { db } = ctx;
        const chapters = await db.query('chapters').withIndex('by_subjectId_order').collect();
        return chapters;
    }
})

/**
 * List all chapters for a specific subject (admin view), sorted by order.
 * Requires authentication.
 */
export const listChaptersBySubject = query({
    args: { subjectId: v.id('subjects') },
    handler: async (ctx, args) => {
        return ctx.db.query('chapters')
            .withIndex('by_subjectId_order', q => q.eq('subjectId', args.subjectId))
            .collect();
    }
});

/**
 * List only active (published) chapters, sorted by order.
 * Public query - no authentication required.
 */
export const listActiveChapters = query({
    args: {},
    handler: async (ctx) => {
     const chapters = await ctx.db.query('chapters').withIndex('by_isActive_order', (q) => q.eq('isActive', true)).collect();
     return chapters;
    }
})

/**
 * Get a single chapter by its slug.
 * Public query - no authentication required.
 */
export const getChapterBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const chapter = await ctx.db.query('chapters').withIndex('by_slug', (q) => q.eq('slug', args.slug)).first();
        return chapter;
    }
})

/**
 * Get a single chapter by its ID.
 * Requires authentication (admin view).
 */
export const getChapterById = authedZodQuery({
    args: getChapterByIdSchema,
    handler: async (ctx, args) => {
        const chapter = await ctx.db.get(args.id as Id<'chapters'>);
        return chapter;
    }
})

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new chapter.
 * Slug is auto-generated from name if not provided.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const createChapter = authedZodMutation({
    args: createChapterSchema,
    handler: async (ctx, args) => {
        const { db } = ctx;

        const baseSlug = args.slug || slugify(args.name);
        const uniqueSlug = await generateUniqueSlug(db, 'chapters', baseSlug);

        const chapterId = await db.insert('chapters', {
            subjectId: args.subjectId as Id<'subjects'>,
            name: args.name,
            slug: uniqueSlug,
            description: args.description,
            order: args.order,
            isActive: args.isActive,
            ...createTimestamps(),
        });

        return chapterId;
    }
})

/**
 * Update an existing chapter.
 * If name is changed and slug is not provided, slug is regenerated.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const updateChapter = authedZodMutation({
    args: updateChapterSchema,
    handler: async (ctx, args) => {
        const { db } = ctx;
        const { id, slug, ...otherUpdates } = args;
        const chapterId = id as Id<'chapters'>;

        const existing = await db.get(chapterId);
        if (!existing) {
            throw new Error('Chapter not found');
        }

        const updateData: Record<string, unknown> = {
            ...updateTimestamp(),
        };

        for (const [key, value] of Object.entries(otherUpdates)) {
            if (value !== undefined) {
                updateData[key] = value === null ? undefined : value;
            }
        }

        const newSlug = await handleSlugUpdate(db, 'chapters', {
            slug,
            newName: otherUpdates.name,
            existingName: existing.name,
            excludeId: chapterId,
        });

        if (newSlug !== undefined) {
            updateData.slug = newSlug;
        }

        await db.patch(chapterId, updateData);

        return chapterId;
    }
})

/**
 * Delete a chapter.
 * WARNING: This is a hard delete. Consider implications for child entities (sections).
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const deleteChapter = authedZodMutation({
    args: deleteChapterSchema,
    handler: async (ctx, args) => {
        const { db } = ctx;
        const chapterId = args.id as Id<'chapters'>;

        const existing = await db.get(chapterId);
        if (!existing) {
            throw new Error('Chapter not found');
        }

        // Check for child sections before deletion
        const hasChildren = await db
            .query('sections')
            .withIndex('by_chapterId', (q) => q.eq('chapterId', chapterId))
            .first();
        if (hasChildren) {
            throw new Error('Cannot delete chapter with existing sections. Delete all sections first.');
        }

        await db.delete(chapterId);

        return { success: true };
    }
})

/**
 * Bulk update chapter order values.
 * Used for drag-and-drop reordering in admin UI.
 * Requires authentication.
 * TODO: Add admin role check when implementing IZA-198
 */
export const reorderChapters = authedZodMutation({
    args: reorderChaptersSchema,
    handler: async (ctx, args) => {
        const { db } = ctx;
        const { items } = args;

        await Promise.all(
            items.map(async (item) => {
                const chapterId = item.id as Id<'chapters'>;
                await db.patch(chapterId, {
                    order: item.order,
                    ...updateTimestamp(),
                });
            })
        );

        return { success: true };
    }
})