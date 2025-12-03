import { z } from 'zod';

/**
 * File type constants
 * Defines all supported file types for uploads
 */
export const FILE_TYPES = {
	IMAGE: 'image',
	VIDEO: 'video',
	PDF: 'pdf',
	AUDIO: 'audio',
} as const;

/**
 * Union type of all file types
 */
export type FileType = (typeof FILE_TYPES)[keyof typeof FILE_TYPES];

/**
 * Array of all file type values (for Zod enum)
 */
export const FILE_TYPE_VALUES = Object.values(FILE_TYPES);

/**
 * Zod enum schema for file types
 */
export const fileTypeEnum = z.enum([
	FILE_TYPES.IMAGE,
	FILE_TYPES.VIDEO,
	FILE_TYPES.PDF,
	FILE_TYPES.AUDIO,
]);
