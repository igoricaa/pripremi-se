import { z } from 'zod';

// Slug validation pattern (lowercase alphanumeric with hyphens)
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Create test schema - slug is optional (auto-generated from title if not provided)
export const createTestSchema = z
	.object({
		title: z
			.string()
			.min(1, 'Title is required')
			.max(200, 'Title must be less than 200 characters'),
		slug: z
			.string()
			.min(1, 'Slug must be at least 1 character')
			.max(100, 'Slug must be less than 100 characters')
			.regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens')
			.optional(),
		description: z
			.string()
			.min(1, 'Description is required')
			.max(1000, 'Description must be less than 1000 characters'),

		// Curriculum linking (only one can be set)
		subjectId: z.string().optional(),
		chapterId: z.string().optional(),
		sectionId: z.string().optional(),

		// Test configuration
		timeLimit: z
			.number()
			.int('Time limit must be an integer')
			.min(1)
			.optional(),
		passingScore: z
			.number()
			.min(0, 'Passing score must be at least 0')
			.max(100, 'Passing score must be at most 100'),
		maxAttempts: z
			.number()
			.int('Max attempts must be an integer')
			.min(1)
			.optional(),
		shuffleQuestions: z.boolean().default(false),
		showCorrectAnswers: z.boolean().default(true),

		order: z
			.number()
			.int('Order must be an integer')
			.min(0, 'Order must be 0 or greater'),
		isActive: z.boolean().default(false),
	})
	.refine(
		(data) => {
			const links = [data.subjectId, data.chapterId, data.sectionId].filter(
				Boolean
			);
			return links.length <= 1;
		},
		{ message: 'Test can only be linked to one curriculum level' }
	);

export type CreateTestInput = z.infer<typeof createTestSchema>;

// Update test schema - all fields optional except id
export const updateTestSchema = z.object({
	id: z.string().min(1, 'Test ID is required'),
	title: z
		.string()
		.min(1, 'Title must be at least 1 character')
		.max(200, 'Title must be less than 200 characters')
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
		.max(1000, 'Description must be less than 1000 characters')
		.optional(),

	// Curriculum linking (nullable to allow unlinking)
	subjectId: z.string().optional().nullable(),
	chapterId: z.string().optional().nullable(),
	sectionId: z.string().optional().nullable(),

	// Test configuration
	timeLimit: z
		.number()
		.int('Time limit must be an integer')
		.min(1)
		.optional()
		.nullable(),
	passingScore: z
		.number()
		.min(0, 'Passing score must be at least 0')
		.max(100, 'Passing score must be at most 100')
		.optional(),
	maxAttempts: z
		.number()
		.int('Max attempts must be an integer')
		.min(1)
		.optional()
		.nullable(),
	shuffleQuestions: z.boolean().optional(),
	showCorrectAnswers: z.boolean().optional(),

	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater')
		.optional(),
	isActive: z.boolean().optional(),
});

export type UpdateTestInput = z.infer<typeof updateTestSchema>;

// Schema for getting test by slug (public)
export const getTestBySlugSchema = z.object({
	slug: z.string().min(1, 'Slug is required'),
});

export type GetTestBySlugInput = z.infer<typeof getTestBySlugSchema>;

// Schema for getting test by ID
export const getTestByIdSchema = z.object({
	id: z.string().min(1, 'Test ID is required'),
});

export type GetTestByIdInput = z.infer<typeof getTestByIdSchema>;

// Schema for deleting a test
export const deleteTestSchema = z.object({
	id: z.string().min(1, 'Test ID is required'),
});

export type DeleteTestInput = z.infer<typeof deleteTestSchema>;

// Schema for reordering tests (bulk update)
export const reorderTestsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1, 'Test ID is required'),
			order: z
				.number()
				.int('Order must be an integer')
				.min(0, 'Order must be 0 or greater'),
		})
	),
});

export type ReorderTestsInput = z.infer<typeof reorderTestsSchema>;
