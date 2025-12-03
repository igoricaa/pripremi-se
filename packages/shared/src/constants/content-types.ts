import { z } from 'zod';

/**
 * Lesson content type constants
 * Defines all supported content types for lessons
 */
export const CONTENT_TYPES = {
	TEXT: 'text',
	VIDEO: 'video',
	INTERACTIVE: 'interactive',
} as const;

/**
 * Union type of all content types
 */
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

/**
 * Array of all content type values (for Zod enum)
 */
export const CONTENT_TYPE_VALUES = Object.values(CONTENT_TYPES);

/**
 * Zod enum schema for content types
 */
export const contentTypeEnum = z.enum([
	CONTENT_TYPES.TEXT,
	CONTENT_TYPES.VIDEO,
	CONTENT_TYPES.INTERACTIVE,
]);
