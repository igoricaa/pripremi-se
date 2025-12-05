import { z } from 'zod';
import { contentTypeEnum, questionDifficultyEnum, questionTypeEnum } from '@pripremi-se/shared';

/**
 * Zod validators for seed data.
 * Used to validate JSON seed files before processing.
 */

/**
 * Question option validator.
 */
export const seedQuestionOptionSchema = z.object({
	text: z.string().min(1, 'Option text is required'),
	isCorrect: z.boolean(),
	order: z.number().int().min(0),
});

/**
 * Question validator.
 * Validates question structure and type-specific requirements.
 */
export const seedQuestionSchema = z
	.object({
		text: z.string().min(1, 'Question text is required'),
		type: questionTypeEnum,
		explanation: z.string().min(1, 'Explanation is required'),
		difficulty: questionDifficultyEnum,
		points: z.number().int().min(1).max(10),
		allowPartialCredit: z.boolean().optional().default(false),
		lessonSlug: z.string().optional(),
		options: z.array(seedQuestionOptionSchema).optional(),
	})
	.superRefine((data, ctx) => {
		// Validate options based on question type
		const { type, options } = data;

		if (type === 'single_choice' || type === 'true_false') {
			if (!options || options.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `${type} questions must have options`,
					path: ['options'],
				});
				return;
			}
			const correctCount = options.filter((o) => o.isCorrect).length;
			if (correctCount !== 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `${type} questions must have exactly one correct answer`,
					path: ['options'],
				});
			}
			if (type === 'true_false' && options.length !== 2) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'true_false questions must have exactly 2 options',
					path: ['options'],
				});
			}
		} else if (type === 'multiple_choice') {
			if (!options || options.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'multiple_choice questions must have options',
					path: ['options'],
				});
				return;
			}
			const correctCount = options.filter((o) => o.isCorrect).length;
			if (correctCount < 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'multiple_choice questions must have at least one correct answer',
					path: ['options'],
				});
			}
		} else if (type === 'short_answer' || type === 'essay') {
			if (options && options.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `${type} questions should not have options`,
					path: ['options'],
				});
			}
		}
	});

/**
 * Test validator.
 */
export const seedTestSchema = z.object({
	title: z.string().min(1, 'Test title is required'),
	slug: z.string().min(1, 'Test slug is required'),
	description: z.string().min(1, 'Test description is required'),
	timeLimit: z.number().int().min(1).optional(),
	passingScore: z.number().int().min(0).max(100),
	maxAttempts: z.number().int().min(1).optional(),
	shuffleQuestions: z.boolean(),
	showCorrectAnswers: z.boolean(),
	questions: z.array(seedQuestionSchema).min(1, 'Test must have at least one question'),
});

/**
 * Lesson validator.
 */
export const seedLessonSchema = z.object({
	title: z.string().min(1, 'Lesson title is required'),
	slug: z.string().min(1, 'Lesson slug is required'),
	content: z.string().min(1, 'Lesson content is required'),
	contentType: contentTypeEnum,
	estimatedMinutes: z.number().int().min(1).max(120),
});

/**
 * Section validator.
 */
export const seedSectionSchema = z.object({
	name: z.string().min(1, 'Section name is required'),
	slug: z.string().min(1, 'Section slug is required'),
	description: z.string().optional(),
	lessons: z.array(seedLessonSchema).min(1, 'Section must have at least one lesson'),
	test: seedTestSchema.optional(),
});

/**
 * Chapter validator.
 */
export const seedChapterSchema = z.object({
	name: z.string().min(1, 'Chapter name is required'),
	slug: z.string().min(1, 'Chapter slug is required'),
	description: z.string().min(1, 'Chapter description is required'),
	sections: z.array(seedSectionSchema).min(1, 'Chapter must have at least one section'),
});

/**
 * Subject validator - root of seed data.
 */
export const seedSubjectSchema = z.object({
	name: z.string().min(1, 'Subject name is required'),
	slug: z.string().min(1, 'Subject slug is required'),
	description: z.string().min(1, 'Subject description is required'),
	icon: z.string().optional(),
	chapters: z.array(seedChapterSchema).min(1, 'Subject must have at least one chapter'),
});

/**
 * Type exports for use in other files.
 */
export type SeedQuestionOptionInput = z.infer<typeof seedQuestionOptionSchema>;
export type SeedQuestionInput = z.infer<typeof seedQuestionSchema>;
export type SeedTestInput = z.infer<typeof seedTestSchema>;
export type SeedLessonInput = z.infer<typeof seedLessonSchema>;
export type SeedSectionInput = z.infer<typeof seedSectionSchema>;
export type SeedChapterInput = z.infer<typeof seedChapterSchema>;
export type SeedSubjectInput = z.infer<typeof seedSubjectSchema>;
