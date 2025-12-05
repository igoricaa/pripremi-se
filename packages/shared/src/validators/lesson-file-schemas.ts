import { z } from 'zod';
import { type FileType, fileTypeEnum } from '../constants/file-types';

// MIME types mapped to file types
export const MIME_TYPE_MAP: Record<string, FileType> = {
	// Images
	'image/jpeg': 'image',
	'image/png': 'image',
	'image/gif': 'image',
	'image/webp': 'image',
	'image/svg+xml': 'image',
	// Videos
	'video/mp4': 'video',
	'video/webm': 'video',
	'video/ogg': 'video',
	// PDFs
	'application/pdf': 'pdf',
	// Audio
	'audio/mpeg': 'audio',
	'audio/mp3': 'audio',
	'audio/wav': 'audio',
	'audio/ogg': 'audio',
	'audio/webm': 'audio',
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS: Record<FileType, number> = {
	image: 10 * 1024 * 1024, // 10 MB
	video: 500 * 1024 * 1024, // 500 MB
	pdf: 50 * 1024 * 1024, // 50 MB
	audio: 100 * 1024 * 1024, // 100 MB
};

/**
 * Helper to get file type from MIME type
 */
export function getFileTypeFromMime(mimeType: string): FileType | null {
	return MIME_TYPE_MAP[mimeType] ?? null;
}

/**
 * Schema for creating a lesson file record after upload
 */
export const createLessonFileSchema = z.object({
	lessonId: z.string().min(1, 'Lesson ID is required'),
	storageId: z.string().min(1, 'Storage ID is required'),
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(255, 'File name must be less than 255 characters'),
	fileType: fileTypeEnum,
	mimeType: z
		.string()
		.min(1, 'MIME type is required')
		.max(100, 'MIME type must be less than 100 characters'),
	fileSize: z
		.number()
		.int('File size must be an integer')
		.positive('File size must be positive'),
	altText: z
		.string()
		.max(255, 'Alt text must be less than 255 characters')
		.optional(),
});

export type CreateLessonFileInput = z.infer<typeof createLessonFileSchema>;

/**
 * Schema for updating a lesson file (mainly alt text)
 */
export const updateLessonFileSchema = z.object({
	id: z.string().min(1, 'File ID is required'),
	altText: z
		.string()
		.max(255, 'Alt text must be less than 255 characters')
		.optional()
		.nullable(),
});

export type UpdateLessonFileInput = z.infer<typeof updateLessonFileSchema>;

/**
 * Schema for getting a lesson file by ID
 */
export const getLessonFileByIdSchema = z.object({
	id: z.string().min(1, 'File ID is required'),
});

export type GetLessonFileByIdInput = z.infer<typeof getLessonFileByIdSchema>;

/**
 * Schema for deleting a lesson file
 */
export const deleteLessonFileSchema = z.object({
	id: z.string().min(1, 'File ID is required'),
});

export type DeleteLessonFileInput = z.infer<typeof deleteLessonFileSchema>;

/**
 * Schema for listing lesson files by lesson ID
 */
export const listLessonFilesByLessonSchema = z.object({
	lessonId: z.string().min(1, 'Lesson ID is required'),
});

export type ListLessonFilesByLessonInput = z.infer<
	typeof listLessonFilesByLessonSchema
>;
