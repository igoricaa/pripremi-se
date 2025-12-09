import { z } from 'zod';

// Slug validation pattern (lowercase alphanumeric with hyphens)
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Create subject schema - slug is optional (auto-generated from name if not provided)
export const createSubjectSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name must be less than 100 characters'),
	slug: z
		.string()
		.min(1, 'Slug must be at least 1 character')
		.max(100, 'Slug must be less than 100 characters')
		.regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens')
		.optional(),
	description: z
		.string()
		.min(1, 'Description is required')
		.max(500, 'Description must be less than 500 characters'),
	icon: z.string().max(255, 'Icon must be less than 255 characters').optional(),
	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater'),
	isActive: z.boolean().default(false),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// Update subject schema - all fields optional except id
export const updateSubjectSchema = z.object({
	id: z.string().min(1, 'Subject ID is required'),
	name: z
		.string()
		.min(1, 'Name must be at least 1 character')
		.max(100, 'Name must be less than 100 characters')
		.optional(),
	slug: z
		.string()
		.min(1, 'Slug must be at least 1 character')
		.max(100, 'Slug must be less than 100 characters')
		.regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens')
		.optional(),
	description: z
		.string()
		.min(1, 'Description must be at least 1 character')
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	icon: z
		.string()
		.max(255, 'Icon must be less than 255 characters')
		.optional()
		.nullable(),
	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater')
		.optional(),
	isActive: z.boolean().optional(),
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

// Schema for getting subject by slug (public)
export const getSubjectBySlugSchema = z.object({
	slug: z.string().min(1, 'Slug is required'),
});

export type GetSubjectBySlugInput = z.infer<typeof getSubjectBySlugSchema>;

// Schema for getting subject by ID
export const getSubjectByIdSchema = z.object({
	id: z.string().min(1, 'Subject ID is required'),
});

export type GetSubjectByIdInput = z.infer<typeof getSubjectByIdSchema>;

// Schema for deleting a subject
export const deleteSubjectSchema = z.object({
	id: z.string().min(1, 'Subject ID is required'),
});

export type DeleteSubjectInput = z.infer<typeof deleteSubjectSchema>;

// Schema for reordering subjects (bulk update)
export const reorderSubjectsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1, 'Subject ID is required'),
			order: z
				.number()
				.int('Order must be an integer')
				.min(0, 'Order must be 0 or greater'),
		})
	),
});

export type ReorderSubjectsInput = z.infer<typeof reorderSubjectsSchema>;
