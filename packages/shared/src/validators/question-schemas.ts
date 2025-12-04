import { z } from 'zod';
import { questionTypeEnum, questionDifficultyEnum } from '../constants';

// Create question schema (simplified - no test linking)
export const createQuestionSchema = z.object({
	text: z.string().min(1, 'Question text is required').max(2000, 'Question text must be less than 2000 characters'),
	explanation: z
		.string()
		.max(1000, 'Explanation must be less than 1000 characters')
		.optional(),

	type: questionTypeEnum,

	// Scoring
	points: z.number().min(0, 'Points must be at least 0'),
	allowPartialCredit: z.boolean().default(false),

	// Educational linking and categorization
	lessonId: z.string().min(1).optional(),
	difficulty: questionDifficultyEnum.optional(),

	// Metadata
	isActive: z.boolean().default(true),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

// Update question schema (removed order - now in junction table)
export const updateQuestionSchema = z.object({
	id: z.string().min(1, 'Question ID is required'),
	text: z
		.string()
		.min(1, 'Question text must be at least 1 character')
		.max(2000, 'Question text must be less than 2000 characters')
		.optional(),
	explanation: z
		.string()
		.max(1000, 'Explanation must be less than 1000 characters')
		.optional()
		.nullable(),

	type: questionTypeEnum.optional(),

	// Scoring
	points: z.number().min(0, 'Points must be at least 0').optional(),
	allowPartialCredit: z.boolean().optional(),

	// Educational linking and categorization
	lessonId: z.string().min(1).optional().nullable(),
	difficulty: questionDifficultyEnum.optional().nullable(),

	// Metadata
	isActive: z.boolean().optional(),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

// Get question by ID
export const getQuestionByIdSchema = z.object({
	id: z.string().min(1, 'Question ID is required'),
});

export type GetQuestionByIdInput = z.infer<typeof getQuestionByIdSchema>;

// Delete question
export const deleteQuestionSchema = z.object({
	id: z.string().min(1, 'Question ID is required'),
});

export type DeleteQuestionInput = z.infer<typeof deleteQuestionSchema>;

// ============================================================================
// QUESTION OPTIONS SCHEMAS
// ============================================================================

// Create question option
export const createQuestionOptionSchema = z.object({
	questionId: z.string().min(1, 'Question ID is required'),
	text: z.string().min(1, 'Option text is required').max(500, 'Option text must be less than 500 characters'),
	isCorrect: z.boolean(),
	order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater'),
});

export type CreateQuestionOptionInput = z.infer<typeof createQuestionOptionSchema>;

// Update question option
export const updateQuestionOptionSchema = z.object({
	id: z.string().min(1, 'Option ID is required'),
	text: z
		.string()
		.min(1, 'Option text must be at least 1 character')
		.max(500, 'Option text must be less than 500 characters')
		.optional(),
	isCorrect: z.boolean().optional(),
	order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater').optional(),
});

export type UpdateQuestionOptionInput = z.infer<typeof updateQuestionOptionSchema>;

// Delete question option
export const deleteQuestionOptionSchema = z.object({
	id: z.string().min(1, 'Option ID is required'),
});

export type DeleteQuestionOptionInput = z.infer<typeof deleteQuestionOptionSchema>;

// ============================================================================
// BULK CREATE QUESTION WITH OPTIONS
// ============================================================================

// Schema for creating question with options in a single transaction
export const createQuestionWithOptionsSchema = z.object({
	question: createQuestionSchema,
	options: z.array(
		z.object({
			text: z.string().min(1, 'Option text is required').max(500, 'Option text must be less than 500 characters'),
			isCorrect: z.boolean(),
			order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater'),
		})
	),
});

export type CreateQuestionWithOptionsInput = z.infer<typeof createQuestionWithOptionsSchema>;
