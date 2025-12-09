import { z } from 'zod';

// ============================================================================
// TEST-QUESTION LINKING SCHEMAS
// ============================================================================

// Link existing question to test
export const linkQuestionToTestSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
	questionId: z.string().min(1, 'Question ID is required'),
	order: z
		.number()
		.int('Order must be an integer')
		.min(0, 'Order must be 0 or greater'),
});

export type LinkQuestionToTestInput = z.infer<typeof linkQuestionToTestSchema>;

// Unlink question from test
export const unlinkQuestionFromTestSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
	questionId: z.string().min(1, 'Question ID is required'),
});

export type UnlinkQuestionFromTestInput = z.infer<
	typeof unlinkQuestionFromTestSchema
>;

// Reorder questions within test
export const reorderTestQuestionsSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
	items: z.array(
		z.object({
			questionId: z.string().min(1, 'Question ID is required'),
			order: z
				.number()
				.int('Order must be an integer')
				.min(0, 'Order must be 0 or greater'),
		})
	),
});

export type ReorderTestQuestionsInput = z.infer<
	typeof reorderTestQuestionsSchema
>;

// List tests for a specific question
export const listTestsForQuestionSchema = z.object({
	questionId: z.string().min(1, 'Question ID is required'),
});

export type ListTestsForQuestionInput = z.infer<
	typeof listTestsForQuestionSchema
>;
