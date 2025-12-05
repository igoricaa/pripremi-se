import {
	createLessonFileSchema,
	updateLessonFileSchema,
	getLessonFileByIdSchema,
	deleteLessonFileSchema,
	listLessonFilesByLessonSchema,
} from '@pripremi-se/shared';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { editorZodMutation, editorZodQuery, editorMutation, query } from './lib';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all files for a specific lesson (admin view).
 * Requires editor or admin role.
 */
export const listLessonFilesByLesson = editorZodQuery({
	args: listLessonFilesByLessonSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const lessonId = args.lessonId as Id<'lessons'>;

		const files = await db
			.query('lessonFiles')
			.withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
			.collect();

		// Get URLs for each file
		const filesWithUrls = await Promise.all(
			files.map(async (file) => {
				const url = await ctx.storage.getUrl(file.storageId);
				return {
					...file,
					url,
				};
			})
		);

		return filesWithUrls;
	},
});

/**
 * Get a single file by ID.
 * Requires editor or admin role.
 */
export const getLessonFileById = editorZodQuery({
	args: getLessonFileByIdSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const file = await db.get(args.id as Id<'lessonFiles'>);

		if (!file) return null;

		const url = await ctx.storage.getUrl(file.storageId);
		return {
			...file,
			url,
		};
	},
});

/**
 * Get a file URL by storage ID.
 * Public query for displaying files in lessons.
 */
export const getFileUrl = query({
	args: { storageId: v.id('_storage') },
	handler: async (ctx, args) => {
		return ctx.storage.getUrl(args.storageId);
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Generate an upload URL for file upload.
 * Client-side uploads file directly to Convex storage.
 * Requires editor or admin role.
 */
export const generateUploadUrl = editorMutation({
	args: {},
	handler: async (ctx) => {
		return ctx.storage.generateUploadUrl();
	},
});

/**
 * Create a lesson file record after successful upload.
 * Requires editor or admin role.
 */
export const createLessonFile = editorZodMutation({
	args: createLessonFileSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Verify the lesson exists
		const lesson = await db.get(args.lessonId as Id<'lessons'>);
		if (!lesson) {
			throw new Error('Lesson not found');
		}

		const fileId = await db.insert('lessonFiles', {
			lessonId: args.lessonId as Id<'lessons'>,
			storageId: args.storageId as Id<'_storage'>,
			fileName: args.fileName,
			fileType: args.fileType,
			mimeType: args.mimeType,
			fileSize: args.fileSize,
			altText: args.altText,
			createdAt: Date.now(),
		});

		return fileId;
	},
});

/**
 * Update a lesson file (mainly for alt text).
 * Requires editor or admin role.
 */
export const updateLessonFile = editorZodMutation({
	args: updateLessonFileSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, altText } = args;
		const fileId = id as Id<'lessonFiles'>;

		const existing = await db.get(fileId);
		if (!existing) {
			throw new Error('File not found');
		}

		await db.patch(fileId, {
			altText: altText === null ? undefined : altText,
		});

		return fileId;
	},
});

/**
 * Delete a lesson file and its storage.
 * Requires editor or admin role.
 */
export const deleteLessonFile = editorZodMutation({
	args: deleteLessonFileSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const fileId = args.id as Id<'lessonFiles'>;

		const existing = await db.get(fileId);
		if (!existing) {
			throw new Error('File not found');
		}

		// Delete from storage
		await ctx.storage.delete(existing.storageId);

		// Delete the record
		await db.delete(fileId);

		return { success: true };
	},
});

/**
 * Delete all files for a lesson.
 * Used when deleting a lesson.
 * Requires editor or admin role.
 */
export const deleteAllLessonFiles = editorMutation({
	args: { lessonId: v.id('lessons') },
	handler: async (ctx, args) => {
		const { db } = ctx;

		const files = await db
			.query('lessonFiles')
			.withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId))
			.collect();

		// Delete each file from storage and remove records
		await Promise.all(
			files.map(async (file) => {
				await ctx.storage.delete(file.storageId);
				await db.delete(file._id);
			})
		);

		return { success: true, deletedCount: files.length };
	},
});
