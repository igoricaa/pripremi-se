import { z } from 'zod';

// Schema for submitting a single answer response
export const submitAnswerResponseSchema = z.object({
	attemptId: z.string().min(1, 'Attempt ID is required'),
	questionId: z.string().min(1, 'Question ID is required'),
	selectedOptionIds: z.array(z.string().min(1)).optional(),
	textAnswer: z.string().optional(),
	isCorrect: z.boolean(),
	pointsEarned: z.number().min(0, 'Points earned must be 0 or greater'),
	timeSpent: z.number().int('Time spent must be an integer').min(0, 'Time spent must be 0 or greater').optional(),
});

export type SubmitAnswerResponseInput = z.infer<typeof submitAnswerResponseSchema>;

// Schema for getting a single answer response by ID
export const getAnswerResponseSchema = z.object({
	id: z.string().min(1, 'Response ID is required'),
});

export type GetAnswerResponseInput = z.infer<typeof getAnswerResponseSchema>;

// Schema for listing all responses for an attempt
export const listAttemptResponsesSchema = z.object({
	attemptId: z.string().min(1, 'Attempt ID is required'),
});

export type ListAttemptResponsesInput = z.infer<typeof listAttemptResponsesSchema>;

// Schema for listing all responses for a question (analytics)
export const listQuestionResponsesSchema = z.object({
	questionId: z.string().min(1, 'Question ID is required'),
	limit: z.number().int('Limit must be an integer').min(1).max(100).default(50),
});

export type ListQuestionResponsesInput = z.infer<typeof listQuestionResponsesSchema>;
