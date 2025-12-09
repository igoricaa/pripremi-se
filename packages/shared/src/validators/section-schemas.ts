import { z } from 'zod';

export const createSectionSchema = z.object({
	chapterId: z.string().min(1, 'Chapter ID is required'),
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name must be less than 100 characters'),
	slug: z
		.string()
		.min(1)
		.max(100, 'Slug must be less than 100 characters')
		.optional(),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater'),
	isActive: z.boolean().default(false),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
	id: z.string().min(1, 'Section ID is required'),
	name: z
		.string()
		.min(1)
		.max(100, 'Name must be less than 100 characters')
		.optional(),
	slug: z
		.string()
		.min(1)
		.max(100, 'Slug must be less than 100 characters')
		.optional(),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional()
		.nullable(),
	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater')
		.optional(),
	isActive: z.boolean().optional(),
});

export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export const getSectionByIdSchema = z.object({
	id: z.string().min(1, 'Section ID is required'),
});

export type GetSectionByIdInput = z.infer<typeof getSectionByIdSchema>;

export const deleteSectionSchema = z.object({
	id: z.string().min(1, 'Section ID is required'),
});

export type DeleteSectionInput = z.infer<typeof deleteSectionSchema>;

export const reorderSectionsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1, 'Section ID is required'),
			order: z
				.number()
				.int('Order must be an integer')
				.min(0, 'Order must be 0 or greater'),
		})
	),
});

export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
