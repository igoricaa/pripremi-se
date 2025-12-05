import { v } from 'convex/values';
import { action, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { seedSubjectSchema } from './validators';
import type { SeedResult, SeedSubject } from './types';
import {
	findOrCreateSubject,
	findOrCreateChapter,
	findOrCreateSection,
	findOrCreateLesson,
	findOrCreateTest,
	createQuestionWithOptions,
	linkQuestionToTest,
	buildLessonSlugMap,
	createEmptySeedResult,
} from './helpers';

/**
 * Main seed mutation for populating curriculum data.
 *
 * This mutation processes a full subject hierarchy including:
 * - Subject metadata
 * - Chapters with ordering
 * - Sections with lessons and tests
 * - Questions with options linked to tests
 *
 * The mutation is idempotent - running it multiple times will update
 * existing records rather than creating duplicates (based on slugs).
 *
 * Usage:
 * 1. Via Convex Dashboard: Find `seed:seedCurriculum` and run with data
 * 2. Via script: `npx convex run seed:seedCurriculum --args '{"data": ...}'`
 *
 * @param data - Full subject data conforming to SeedSubject interface
 * @returns SeedResult with counts of created/updated records
 */
export const seedCurriculum = internalMutation({
	args: {
		data: v.any(),
	},
	handler: async (ctx, args): Promise<SeedResult> => {
		// Validate input data
		const parseResult = seedSubjectSchema.safeParse(args.data);
		if (!parseResult.success) {
			const errors = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
			throw new Error(`Invalid seed data: ${errors}`);
		}

		const subjectData: SeedSubject = parseResult.data;

		// Create/update subject
		const subjectId = await findOrCreateSubject(ctx, {
			name: subjectData.name,
			slug: subjectData.slug,
			description: subjectData.description,
			icon: subjectData.icon,
			order: 1, // First subject
		});

		const result = createEmptySeedResult(subjectId, subjectData.name);

		// Process chapters
		for (let chapterIdx = 0; chapterIdx < subjectData.chapters.length; chapterIdx++) {
			const chapter = subjectData.chapters[chapterIdx];

			const chapterId = await findOrCreateChapter(ctx, {
				subjectId,
				name: chapter.name,
				slug: chapter.slug,
				description: chapter.description,
				order: chapterIdx + 1,
			});
			result.chaptersCreated++;

			// Process sections
			for (let sectionIdx = 0; sectionIdx < chapter.sections.length; sectionIdx++) {
				const section = chapter.sections[sectionIdx];

				const sectionId = await findOrCreateSection(ctx, {
					chapterId,
					name: section.name,
					slug: section.slug,
					description: section.description,
					order: sectionIdx + 1,
				});
				result.sectionsCreated++;

				// Process lessons
				for (let lessonIdx = 0; lessonIdx < section.lessons.length; lessonIdx++) {
					const lesson = section.lessons[lessonIdx];

					await findOrCreateLesson(ctx, {
						sectionId,
						title: lesson.title,
						slug: lesson.slug,
						content: lesson.content,
						contentType: lesson.contentType,
						estimatedMinutes: lesson.estimatedMinutes,
						order: lessonIdx + 1,
					});
					result.lessonsCreated++;
				}

				// Process test if present
				if (section.test) {
					const test = section.test;

					const testId = await findOrCreateTest(ctx, {
						sectionId,
						title: test.title,
						slug: test.slug,
						description: test.description,
						timeLimit: test.timeLimit,
						passingScore: test.passingScore,
						maxAttempts: test.maxAttempts,
						shuffleQuestions: test.shuffleQuestions,
						showCorrectAnswers: test.showCorrectAnswers,
						order: 1, // One test per section
					});
					result.testsCreated++;

					// Build lesson slug map for resolving lessonSlug references
					const lessonSlugMap = await buildLessonSlugMap(ctx, subjectId);

					// Process questions
					for (let questionIdx = 0; questionIdx < test.questions.length; questionIdx++) {
						const question = test.questions[questionIdx];

						// Resolve lessonSlug to lessonId
						let lessonId: Id<'lessons'> | undefined;
						if (question.lessonSlug) {
							lessonId = lessonSlugMap.get(question.lessonSlug);
							if (!lessonId) {
								console.warn(`Warning: lessonSlug "${question.lessonSlug}" not found, skipping lesson link`);
							}
						}

						const { questionId, optionCount } = await createQuestionWithOptions(ctx, {
							text: question.text,
							type: question.type,
							explanation: question.explanation,
							difficulty: question.difficulty,
							points: question.points,
							allowPartialCredit: question.allowPartialCredit ?? false,
							lessonId,
							options: question.options ?? [],
						});
						result.questionsCreated++;
						result.questionOptionsCreated += optionCount;

						// Link question to test
						await linkQuestionToTest(ctx, testId, questionId, questionIdx + 1);
					}
				}
			}
		}

		return result;
	},
});

/**
 * Clear all curriculum data.
 * WARNING: This is destructive and should only be used in development.
 *
 * Order matters due to foreign key relationships:
 * 1. testQuestions (references tests and questions)
 * 2. questionOptions (references questions)
 * 3. questions (references lessons)
 * 4. tests (references sections)
 * 5. lessons (references sections)
 * 6. sections (references chapters)
 * 7. chapters (references subjects)
 * 8. subjects (root)
 */
export const clearCurriculum = internalMutation({
	args: {},
	handler: async (ctx): Promise<{ deleted: Record<string, number> }> => {
		const deleted: Record<string, number> = {};

		// Delete test-question links
		const testQuestions = await ctx.db.query('testQuestions').collect();
		for (const tq of testQuestions) {
			await ctx.db.delete(tq._id);
		}
		deleted.testQuestions = testQuestions.length;

		// Delete question options
		const questionOptions = await ctx.db.query('questionOptions').collect();
		for (const qo of questionOptions) {
			await ctx.db.delete(qo._id);
		}
		deleted.questionOptions = questionOptions.length;

		// Delete questions
		const questions = await ctx.db.query('questions').collect();
		for (const q of questions) {
			await ctx.db.delete(q._id);
		}
		deleted.questions = questions.length;

		// Delete tests
		const tests = await ctx.db.query('tests').collect();
		for (const t of tests) {
			await ctx.db.delete(t._id);
		}
		deleted.tests = tests.length;

		// Delete lessons
		const lessons = await ctx.db.query('lessons').collect();
		for (const l of lessons) {
			await ctx.db.delete(l._id);
		}
		deleted.lessons = lessons.length;

		// Delete sections
		const sections = await ctx.db.query('sections').collect();
		for (const s of sections) {
			await ctx.db.delete(s._id);
		}
		deleted.sections = sections.length;

		// Delete chapters
		const chapters = await ctx.db.query('chapters').collect();
		for (const c of chapters) {
			await ctx.db.delete(c._id);
		}
		deleted.chapters = chapters.length;

		// Delete subjects
		const subjects = await ctx.db.query('subjects').collect();
		for (const s of subjects) {
			await ctx.db.delete(s._id);
		}
		deleted.subjects = subjects.length;

		return { deleted };
	},
});

/**
 * Development action to run seed with JSON data.
 * This wraps the internal mutation for CLI testing.
 *
 * Usage: npx convex run seed:runSeed --args '{"data": <seed-json>}'
 */
export const runSeed = action({
	args: {
		data: v.any(),
	},
	handler: async (ctx, args): Promise<SeedResult> => {
		return await ctx.runMutation(internal.seed.index.seedCurriculum, {
			data: args.data,
		});
	},
});

/**
 * Development action to clear all curriculum data.
 * This wraps the internal mutation for CLI testing.
 *
 * Usage: npx convex run seed:runClear
 */
export const runClear = action({
	args: {},
	handler: async (ctx): Promise<{ deleted: Record<string, number> }> => {
		return await ctx.runMutation(internal.seed.index.clearCurriculum, {});
	},
});
