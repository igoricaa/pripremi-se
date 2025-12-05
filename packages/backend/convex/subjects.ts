import {
	createSubjectSchema,
	updateSubjectSchema,
	getSubjectByIdSchema,
	deleteSubjectSchema,
	reorderSubjectsSchema,
} from '@pripremi-se/shared';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { query } from './_generated/server';
import {
	editorZodMutation,
	editorZodQuery,
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
 * List all subjects (admin view), sorted by order.
 * Requires editor or admin role.
 */
export const listSubjects = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		const subjects = await ctx.db.query('subjects').withIndex('by_order').collect();

		return subjects;
	},
});

/**
 * List only active (published) subjects, sorted by order.
 * Public query - no authentication required.
 */
export const listActiveSubjects = query({
	args: {},
	handler: async (ctx) => {
		const subjects = await ctx.db
			.query('subjects')
			.withIndex('by_isActive_order', (q) => q.eq('isActive', true))
			.collect();

		return subjects;
	},
});

/**
 * Get a single subject by its slug.
 * Public query - no authentication required.
 */
export const getSubjectBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const subject = await ctx.db
			.query('subjects')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.first();

		return subject;
	},
});

/**
 * Get a single subject by its ID.
 * Requires editor or admin role.
 */
export const getSubjectById = editorZodQuery({
	args: getSubjectByIdSchema,
	handler: async (ctx, args) => {
		const subject = await ctx.db.get(args.id as Id<'subjects'>);

		return subject;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new subject.
 * Slug is auto-generated from name if not provided.
 * Requires editor or admin role.
 */
export const createSubject = editorZodMutation({
	args: createSubjectSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Generate slug from name if not provided
		const baseSlug = args.slug || slugify(args.name);
		const uniqueSlug = await generateUniqueSlug(db, 'subjects', baseSlug);

		const subjectId = await db.insert('subjects', {
			name: args.name,
			slug: uniqueSlug,
			description: args.description,
			icon: args.icon,
			order: args.order,
			isActive: args.isActive,
			...createTimestamps(),
		});

		return subjectId;
	},
});

/**
 * Update an existing subject.
 * If name is changed and slug is not provided, slug is regenerated.
 * Requires editor or admin role.
 */
export const updateSubject = editorZodMutation({
	args: updateSubjectSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, slug, ...otherUpdates } = args;
		const subjectId = id as Id<'subjects'>;

		const existing = await db.get(subjectId);
		if (!existing) {
			throw new Error('Subject not found');
		}

		// Build update object with only defined fields
		const updateData: Record<string, unknown> = {
			...updateTimestamp(),
		};

		// Add all defined fields (excluding slug, handled separately)
		for (const [key, value] of Object.entries(otherUpdates)) {
			if (value !== undefined) {
				updateData[key] = value === null ? undefined : value;
			}
		}

		// Handle slug update logic
		const newSlug = await handleSlugUpdate(db, 'subjects', {
			slug,
			newName: otherUpdates.name,
			existingName: existing.name,
			excludeId: subjectId,
		});

		if (newSlug !== undefined) {
			updateData.slug = newSlug;
		}

		await db.patch(subjectId, updateData);

		return subjectId;
	},
});

/**
 * Delete a subject.
 * WARNING: This is a hard delete. Consider implications for child entities.
 * Requires editor or admin role.
 */
export const deleteSubject = editorZodMutation({
	args: deleteSubjectSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const subjectId = args.id as Id<'subjects'>;

		const existing = await db.get(subjectId);
		if (!existing) {
			throw new Error('Subject not found');
		}

		// Check for child chapters before deletion
		const hasChildren = await db
			.query('chapters')
			.withIndex('by_subjectId', (q) => q.eq('subjectId', subjectId))
			.first();
		if (hasChildren) {
			throw new Error('Cannot delete subject with existing chapters. Delete all chapters first.');
		}

		await db.delete(subjectId);

		return { success: true };
	},
});

/**
 * Bulk update subject order values.
 * Used for drag-and-drop reordering in admin UI.
 * Requires editor or admin role.
 */
export const reorderSubjects = editorZodMutation({
	args: reorderSubjectsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Update each subject's order in parallel
		await Promise.all(
			args.items.map(async (item) => {
				const subjectId = item.id as Id<'subjects'>;
				await db.patch(subjectId, {
					order: item.order,
					...updateTimestamp(),
				});
			})
		);

		return { success: true };
	},
});
