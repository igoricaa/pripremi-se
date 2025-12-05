import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { createTimestamps } from '../lib';
import type { SeedResult } from './types';

/**
 * Helper functions for seeding curriculum data.
 * These functions handle database operations during seeding.
 */

/**
 * Find or create a subject by slug.
 * Returns existing subject ID if found, creates new one otherwise.
 */
export async function findOrCreateSubject(
	ctx: MutationCtx,
	data: {
		name: string;
		slug: string;
		description: string;
		icon?: string;
		order: number;
	}
): Promise<Id<'subjects'>> {
	const existing = await ctx.db
		.query('subjects')
		.withIndex('by_slug', (q) => q.eq('slug', data.slug))
		.first();

	if (existing) {
		// Update existing subject
		await ctx.db.patch(existing._id, {
			name: data.name,
			description: data.description,
			icon: data.icon,
			order: data.order,
			updatedAt: Date.now(),
		});
		return existing._id;
	}

	return await ctx.db.insert('subjects', {
		...data,
		isActive: true,
		...createTimestamps(),
	});
}

/**
 * Find or create a chapter within a subject.
 */
export async function findOrCreateChapter(
	ctx: MutationCtx,
	data: {
		subjectId: Id<'subjects'>;
		name: string;
		slug: string;
		description: string;
		order: number;
	}
): Promise<Id<'chapters'>> {
	const existing = await ctx.db
		.query('chapters')
		.withIndex('by_slug', (q) => q.eq('slug', data.slug))
		.first();

	if (existing && existing.subjectId === data.subjectId) {
		await ctx.db.patch(existing._id, {
			name: data.name,
			description: data.description,
			order: data.order,
			updatedAt: Date.now(),
		});
		return existing._id;
	}

	return await ctx.db.insert('chapters', {
		...data,
		isActive: true,
		...createTimestamps(),
	});
}

/**
 * Find or create a section within a chapter.
 */
export async function findOrCreateSection(
	ctx: MutationCtx,
	data: {
		chapterId: Id<'chapters'>;
		name: string;
		slug: string;
		description?: string;
		order: number;
	}
): Promise<Id<'sections'>> {
	const existing = await ctx.db
		.query('sections')
		.withIndex('by_slug', (q) => q.eq('slug', data.slug))
		.first();

	if (existing && existing.chapterId === data.chapterId) {
		await ctx.db.patch(existing._id, {
			name: data.name,
			description: data.description,
			order: data.order,
			updatedAt: Date.now(),
		});
		return existing._id;
	}

	return await ctx.db.insert('sections', {
		...data,
		isActive: true,
		...createTimestamps(),
	});
}

/**
 * Find or create a lesson within a section.
 */
export async function findOrCreateLesson(
	ctx: MutationCtx,
	data: {
		sectionId: Id<'sections'>;
		title: string;
		slug: string;
		content: string;
		contentType: string;
		estimatedMinutes: number;
		order: number;
	}
): Promise<Id<'lessons'>> {
	const existing = await ctx.db
		.query('lessons')
		.withIndex('by_slug', (q) => q.eq('slug', data.slug))
		.first();

	if (existing && existing.sectionId === data.sectionId) {
		await ctx.db.patch(existing._id, {
			title: data.title,
			content: data.content,
			contentType: data.contentType,
			estimatedMinutes: data.estimatedMinutes,
			order: data.order,
			updatedAt: Date.now(),
		});
		return existing._id;
	}

	return await ctx.db.insert('lessons', {
		...data,
		isActive: true,
		...createTimestamps(),
	});
}

/**
 * Find or create a test for a section.
 */
export async function findOrCreateTest(
	ctx: MutationCtx,
	data: {
		sectionId: Id<'sections'>;
		title: string;
		slug: string;
		description: string;
		timeLimit?: number;
		passingScore: number;
		maxAttempts?: number;
		shuffleQuestions: boolean;
		showCorrectAnswers: boolean;
		order: number;
	}
): Promise<Id<'tests'>> {
	const existing = await ctx.db
		.query('tests')
		.withIndex('by_slug', (q) => q.eq('slug', data.slug))
		.first();

	if (existing && existing.sectionId === data.sectionId) {
		await ctx.db.patch(existing._id, {
			title: data.title,
			description: data.description,
			timeLimit: data.timeLimit,
			passingScore: data.passingScore,
			maxAttempts: data.maxAttempts,
			shuffleQuestions: data.shuffleQuestions,
			showCorrectAnswers: data.showCorrectAnswers,
			order: data.order,
			updatedAt: Date.now(),
		});
		return existing._id;
	}

	return await ctx.db.insert('tests', {
		...data,
		isActive: true,
		...createTimestamps(),
	});
}

/**
 * Create a question with its options.
 * Questions are always created fresh (no upsert) to avoid complexity with options management.
 */
export async function createQuestionWithOptions(
	ctx: MutationCtx,
	data: {
		text: string;
		type: string;
		explanation: string;
		difficulty: string;
		points: number;
		allowPartialCredit: boolean;
		lessonId?: Id<'lessons'>;
		options: Array<{
			text: string;
			isCorrect: boolean;
			order: number;
		}>;
	}
): Promise<{ questionId: Id<'questions'>; optionCount: number }> {
	const questionId = await ctx.db.insert('questions', {
		text: data.text,
		type: data.type,
		explanation: data.explanation,
		difficulty: data.difficulty,
		points: data.points,
		allowPartialCredit: data.allowPartialCredit,
		lessonId: data.lessonId,
		isActive: true,
		...createTimestamps(),
	});

	for (const option of data.options) {
		await ctx.db.insert('questionOptions', {
			questionId,
			text: option.text,
			isCorrect: option.isCorrect,
			order: option.order,
			createdAt: Date.now(),
		});
	}

	return { questionId, optionCount: data.options.length };
}

/**
 * Link a question to a test via junction table.
 */
export async function linkQuestionToTest(
	ctx: MutationCtx,
	testId: Id<'tests'>,
	questionId: Id<'questions'>,
	order: number
): Promise<Id<'testQuestions'>> {
	// Check if link already exists
	const existing = await ctx.db
		.query('testQuestions')
		.withIndex('by_testId_questionId', (q) => q.eq('testId', testId).eq('questionId', questionId))
		.first();

	if (existing) {
		await ctx.db.patch(existing._id, { order });
		return existing._id;
	}

	return await ctx.db.insert('testQuestions', {
		testId,
		questionId,
		order,
		createdAt: Date.now(),
	});
}

/**
 * Build a lesson slug map for the entire subject.
 * Used to resolve lessonSlug references in questions.
 */
export async function buildLessonSlugMap(
	ctx: MutationCtx,
	subjectId: Id<'subjects'>
): Promise<Map<string, Id<'lessons'>>> {
	const lessonMap = new Map<string, Id<'lessons'>>();

	// Get all chapters for the subject
	const chapters = await ctx.db
		.query('chapters')
		.withIndex('by_subjectId', (q) => q.eq('subjectId', subjectId))
		.collect();

	for (const chapter of chapters) {
		// Get all sections for the chapter
		const sections = await ctx.db
			.query('sections')
			.withIndex('by_chapterId', (q) => q.eq('chapterId', chapter._id))
			.collect();

		for (const section of sections) {
			// Get all lessons for the section
			const lessons = await ctx.db
				.query('lessons')
				.withIndex('by_sectionId', (q) => q.eq('sectionId', section._id))
				.collect();

			for (const lesson of lessons) {
				lessonMap.set(lesson.slug, lesson._id);
			}
		}
	}

	return lessonMap;
}

/**
 * Create an empty seed result object.
 */
export function createEmptySeedResult(subjectId: string, subjectName: string): SeedResult {
	return {
		subjectId,
		subjectName,
		chaptersCreated: 0,
		sectionsCreated: 0,
		lessonsCreated: 0,
		testsCreated: 0,
		questionsCreated: 0,
		questionOptionsCreated: 0,
	};
}
