import { z } from 'zod';

export const createChapterSchema = z.object({
	subjectId: z.string().min(1, 'Subject ID is required'),
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name must be less than 100 characters'),
	slug: z
		.string()
		.min(1, 'Slug is required')
		.max(100, 'Slug must be less than 100 characters')
		.optional(),
	description: z
		.string()
		.min(1, 'Description is required')
		.max(500, 'Description must be less than 500 characters'),
	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater'),
	isActive: z.boolean().default(false),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;

export const updateChapterSchema = z.object({
	id: z.string().min(1, 'Chapter ID is required'),
	name: z
		.string()
		.min(1, 'Name must be at least 1 character')
		.max(100, 'Name must be less than 100 characters')
		.optional(),
	slug: z
		.string()
		.min(1, 'Slug must be at least 1 character')
		.max(100, 'Slug must be less than 100 characters')
		.optional(),
	description: z
		.string()
		.min(1, 'Description must be at least 1 character')
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater')
		.optional(),
	isActive: z.boolean().optional(),
});

export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

export const getChapterBySlugSchema = z.object({
	slug: z.string().min(1, 'Slug is required'),
});

export type GetChapterBySlugInput = z.infer<typeof getChapterBySlugSchema>;

export const getChapterByIdSchema = z.object({
	id: z.string().min(1, 'Chapter ID is required'),
});

export type GetChapterByIdInput = z.infer<typeof getChapterByIdSchema>;

export const deleteChapterSchema = z.object({
	id: z.string().min(1, 'Chapter ID is required'),
});

export type DeleteChapterInput = z.infer<typeof deleteChapterSchema>;

export const reorderChaptersSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1, 'Chapter ID is required'),
			order: z
				.number()
				.int('Order must be an integer')
				.min(0, 'Order must be 0 or greater'),
		})
	),
});

export type ReorderChaptersInput = z.infer<typeof reorderChaptersSchema>;
