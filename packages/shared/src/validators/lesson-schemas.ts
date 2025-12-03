import { z } from 'zod';

export const createLessonSchema = z.object({
	sectionId: z.string().min(1, 'Section ID is required'),
	title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
	slug: z
		.string()
		.min(1)
		.max(100, 'Slug must be less than 100 characters')
		.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
		.optional(),
	content: z.string().min(1, 'Content is required'),
	contentType: z.enum(['text', 'video', 'interactive']),
	estimatedMinutes: z
		.number()
		.int('Estimated minutes must be an integer')
		.min(1, 'Estimated minutes must be at least 1'),
	order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater'),
	isActive: z.boolean().default(false),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = z.object({
	id: z.string().min(1, 'Lesson ID is required'),
	title: z.string().min(1).max(200, 'Title must be less than 200 characters').optional(),
	slug: z
		.string()
		.min(1)
		.max(100, 'Slug must be less than 100 characters')
		.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
		.optional(),
	content: z.string().min(1, 'Content is required').optional(),
	contentType: z.enum(['text', 'video', 'interactive']).optional(),
	estimatedMinutes: z
		.number()
		.int('Estimated minutes must be an integer')
		.min(1, 'Estimated minutes must be at least 1')
		.optional(),
	order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater').optional(),
	isActive: z.boolean().optional(),
});

export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

export const getLessonByIdSchema = z.object({
	id: z.string().min(1, 'Lesson ID is required'),
});

export type GetLessonByIdInput = z.infer<typeof getLessonByIdSchema>;

export const deleteLessonSchema = z.object({
	id: z.string().min(1, 'Lesson ID is required'),
});

export type DeleteLessonInput = z.infer<typeof deleteLessonSchema>;

export const reorderLessonsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1, 'Lesson ID is required'),
			order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater'),
		})
	),
});

export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
