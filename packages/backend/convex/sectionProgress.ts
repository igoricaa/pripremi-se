import {
	startSectionProgressSchema,
	updateLessonCountSchema,
	updateTestResultSchema,
	updateSectionLastAccessedSchema,
	completeSectionProgressSchema,
	recalculateSectionProgressSchema,
	getSectionProgressByIdSchema,
	getUserSectionProgressSchema,
	listUserSectionProgressSchema,
	getChapterProgressSchema,
	getSectionProgressStatsSchema,
	SECTION_PROGRESS_STATUS,
	LESSON_PROGRESS_STATUS,
	TEST_ATTEMPT_STATUS,
} from '@pripremi-se/shared';
import type { Id } from './_generated/dataModel';
import { authedZodMutation, authedZodQuery, adminZodQuery, createTimestamps, updateTimestamp } from './lib';
import { now } from './lib/timestamps';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get section progress by ID.
 * Requires authentication - ownership enforced by RLS.
 */
export const getSectionProgressById = authedZodQuery({
	args: getSectionProgressByIdSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const progressId = args.id as Id<'sectionProgress'>;

		return db.get(progressId);
	},
});

/**
 * Get user's progress for a specific section.
 * Requires authentication.
 */
export const getUserSectionProgress = authedZodQuery({
	args: getUserSectionProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const sectionId = args.sectionId as Id<'sections'>;

		const progress = await db
			.query('sectionProgress')
			.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', sectionId))
			.first();

		return progress;
	},
});

/**
 * List user's section progress with optional status filter.
 * Requires authentication.
 */
export const listUserSectionProgress = authedZodQuery({
	args: listUserSectionProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const { status } = args;

		if (status) {
			return db
				.query('sectionProgress')
				.withIndex('by_userId_status', (q) => q.eq('userId', user._id).eq('status', status))
				.collect();
		}

		return db.query('sectionProgress').withIndex('by_userId', (q) => q.eq('userId', user._id)).collect();
	},
});

/**
 * Get chapter-level progress (aggregate of all sections in chapter).
 * Requires authentication.
 */
export const getChapterProgress = authedZodQuery({
	args: getChapterProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const chapterId = args.chapterId as Id<'chapters'>;

		// Get all sections in this chapter
		const sections = await db.query('sections').withIndex('by_chapterId', (q) => q.eq('chapterId', chapterId)).collect();

		if (sections.length === 0) {
			return {
				totalSections: 0,
				sectionsCompleted: 0,
				sectionsInProgress: 0,
				sectionsNotStarted: 0,
				overallProgress: 0,
			};
		}

		// Get progress for each section
		const sectionIds = sections.map((s) => s._id);
		const progressRecords = await Promise.all(
			sectionIds.map((sectionId) =>
				db
					.query('sectionProgress')
					.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', sectionId))
					.first()
			)
		);

		const completed = progressRecords.filter((p) => p?.status === SECTION_PROGRESS_STATUS.COMPLETED).length;
		const inProgress = progressRecords.filter((p) => p?.status === SECTION_PROGRESS_STATUS.IN_PROGRESS).length;
		const notStarted = sections.length - completed - inProgress;

		return {
			totalSections: sections.length,
			sectionsCompleted: completed,
			sectionsInProgress: inProgress,
			sectionsNotStarted: notStarted,
			overallProgress: Math.round((completed / sections.length) * 100),
		};
	},
});

/**
 * Get section progress statistics (admin only).
 * Shows counts by status for a specific section across all users.
 */
export const getSectionProgressStats = adminZodQuery({
	args: getSectionProgressStatsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const sectionId = args.sectionId as Id<'sections'>;

		// Verify section exists
		const section = await db.get(sectionId);
		if (!section) {
			throw new Error('Section not found');
		}

		// Get all progress records for this section
		const allProgress = await db.query('sectionProgress').withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId)).collect();

		const stats = {
			total: allProgress.length,
			inProgress: 0,
			completed: 0,
			averageScore: 0,
		};

		let totalScore = 0;
		let scoreCount = 0;

		for (const progress of allProgress) {
			if (progress.status === SECTION_PROGRESS_STATUS.IN_PROGRESS) {
				stats.inProgress++;
			} else if (progress.status === SECTION_PROGRESS_STATUS.COMPLETED) {
				stats.completed++;
			}

			if (progress.bestTestScore !== undefined) {
				totalScore += progress.bestTestScore;
				scoreCount++;
			}
		}

		if (scoreCount > 0) {
			stats.averageScore = Math.round(totalScore / scoreCount);
		}

		return stats;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Start or get existing section progress.
 * Creates a new progress record on first access, returns existing if already started.
 * Requires authentication.
 */
export const startSectionProgress = authedZodMutation({
	args: startSectionProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const sectionId = args.sectionId as Id<'sections'>;

		// Verify section exists and is active
		const section = await db.get(sectionId);
		if (!section) {
			throw new Error('Section not found');
		}
		if (!section.isActive) {
			throw new Error('Section is not available');
		}

		// Check for existing progress
		const existingProgress = await db
			.query('sectionProgress')
			.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', sectionId))
			.first();

		if (existingProgress) {
			// Update lastAccessedAt and return existing progress
			const currentTime = now();
			await db.patch(existingProgress._id, {
				lastAccessedAt: currentTime,
				...updateTimestamp(),
			});
			return existingProgress._id;
		}

		// Get total lessons count for this section
		const lessons = await db.query('lessons').withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId)).collect();
		const totalLessons = lessons.filter((l) => l.isActive).length;

		// Create new progress record
		const currentTime = now();
		const progressId = await db.insert('sectionProgress', {
			userId: user._id,
			sectionId,
			lessonsCompleted: 0,
			totalLessons,
			testPassed: false,
			status: SECTION_PROGRESS_STATUS.IN_PROGRESS,
			lastAccessedAt: currentTime,
			...createTimestamps(),
		});

		return progressId;
	},
});

/**
 * Update lesson counts.
 * Called internally when lesson progress changes.
 */
export const updateLessonCount = authedZodMutation({
	args: updateLessonCountSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const sectionId = args.sectionId as Id<'sections'>;

		const progress = await db
			.query('sectionProgress')
			.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', sectionId))
			.first();

		if (!progress) {
			throw new Error('Section progress not found. Start progress first.');
		}

		const updateData: Record<string, unknown> = {
			lessonsCompleted: args.lessonsCompleted,
			totalLessons: args.totalLessons,
			...updateTimestamp(),
		};

		// Auto-complete section if all lessons done and test passed (if test exists)
		if (args.lessonsCompleted >= args.totalLessons && args.totalLessons > 0) {
			// Check if section has a test
			const test = await db.query('tests').withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId)).first();

			// If no test or test already passed, mark as completed
			if (!test || progress.testPassed) {
				updateData.status = SECTION_PROGRESS_STATUS.COMPLETED;
				updateData.completedAt = now();
			}
		}

		await db.patch(progress._id, updateData);
		return progress._id;
	},
});

/**
 * Update test result.
 * Called internally when test attempt completes.
 */
export const updateTestResult = authedZodMutation({
	args: updateTestResultSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const sectionId = args.sectionId as Id<'sections'>;

		const progress = await db
			.query('sectionProgress')
			.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', sectionId))
			.first();

		if (!progress) {
			throw new Error('Section progress not found. Start progress first.');
		}

		const updateData: Record<string, unknown> = {
			testPassed: args.passed || progress.testPassed, // Once passed, stays passed
			bestTestScore: Math.max(args.score, progress.bestTestScore ?? 0),
			...updateTimestamp(),
		};

		// Auto-complete section if all lessons done and test now passed
		if (args.passed && progress.lessonsCompleted >= progress.totalLessons && progress.totalLessons > 0) {
			updateData.status = SECTION_PROGRESS_STATUS.COMPLETED;
			updateData.completedAt = now();
		}

		await db.patch(progress._id, updateData);
		return progress._id;
	},
});

/**
 * Update last accessed timestamp.
 * Called when user views section content.
 */
export const updateLastAccessed = authedZodMutation({
	args: updateSectionLastAccessedSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const sectionId = args.sectionId as Id<'sections'>;

		const progress = await db
			.query('sectionProgress')
			.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', sectionId))
			.first();

		if (!progress) {
			throw new Error('Section progress not found');
		}

		await db.patch(progress._id, {
			lastAccessedAt: now(),
			...updateTimestamp(),
		});

		return progress._id;
	},
});

/**
 * Complete section progress manually.
 * Used for admin override or special cases.
 */
export const completeSectionProgress = authedZodMutation({
	args: completeSectionProgressSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const progressId = args.id as Id<'sectionProgress'>;

		const progress = await db.get(progressId);
		if (!progress) {
			throw new Error('Progress not found');
		}

		if (progress.status === SECTION_PROGRESS_STATUS.COMPLETED) {
			throw new Error('Section is already completed');
		}

		await db.patch(progressId, {
			status: SECTION_PROGRESS_STATUS.COMPLETED,
			completedAt: now(),
			...updateTimestamp(),
		});

		return progressId;
	},
});

/**
 * Recalculate section progress.
 * Rebuilds lessonsCompleted, totalLessons, testPassed, and bestTestScore from source data.
 * Use this if data gets out of sync.
 */
export const recalculateSectionProgress = authedZodMutation({
	args: recalculateSectionProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const sectionId = args.sectionId as Id<'sections'>;

		// Verify section exists
		const section = await db.get(sectionId);
		if (!section) {
			throw new Error('Section not found');
		}

		// Get or create progress record
		let progress = await db
			.query('sectionProgress')
			.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', sectionId))
			.first();

		// Get all active lessons in this section
		const lessons = await db.query('lessons').withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId)).collect();
		const activeLessons = lessons.filter((l) => l.isActive);
		const totalLessons = activeLessons.length;

		// Get completed lessons count
		const lessonProgressRecords = await Promise.all(
			activeLessons.map((lesson) =>
				db
					.query('lessonProgress')
					.withIndex('by_userId_lessonId', (q) => q.eq('userId', user._id).eq('lessonId', lesson._id))
					.first()
			)
		);
		const lessonsCompleted = lessonProgressRecords.filter((lp) => lp?.status === LESSON_PROGRESS_STATUS.COMPLETED).length;

		// Get test results
		const test = await db.query('tests').withIndex('by_sectionId', (q) => q.eq('sectionId', sectionId)).first();

		let testPassed = false;
		let bestTestScore: number | undefined;

		if (test) {
			const attempts = await db
				.query('testAttempts')
				.withIndex('by_userId_testId', (q) => q.eq('userId', user._id).eq('testId', test._id))
				.filter((q) => q.eq(q.field('status'), TEST_ATTEMPT_STATUS.COMPLETED))
				.collect();

			if (attempts.length > 0) {
				const scores = attempts.map((a) => a.score);
				bestTestScore = Math.max(...scores);
				testPassed = bestTestScore >= test.passingScore;
			}
		}

		// Determine status
		let status: string = SECTION_PROGRESS_STATUS.IN_PROGRESS;
		let completedAt = progress?.completedAt;

		if (lessonsCompleted >= totalLessons && totalLessons > 0 && (!test || testPassed)) {
			status = SECTION_PROGRESS_STATUS.COMPLETED;
			if (!completedAt) {
				completedAt = now();
			}
		}

		const currentTime = now();

		if (progress) {
			// Update existing progress
			await db.patch(progress._id, {
				lessonsCompleted,
				totalLessons,
				testPassed,
				bestTestScore,
				status,
				completedAt,
				lastAccessedAt: currentTime,
				...updateTimestamp(),
			});
			return progress._id;
		}
		// Create new progress record
		const progressId = await db.insert('sectionProgress', {
			userId: user._id,
			sectionId,
			lessonsCompleted,
			totalLessons,
			testPassed,
			bestTestScore,
			status,
			completedAt,
			lastAccessedAt: currentTime,
			...createTimestamps(),
		});
		return progressId;
	},
});
