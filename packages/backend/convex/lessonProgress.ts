import {
	startLessonProgressSchema,
	updateLessonProgressSchema,
	completeLessonProgressSchema,
	getLessonProgressSchema,
	getUserLessonProgressSchema,
	listUserLessonProgressSchema,
	LESSON_PROGRESS_STATUS,
	SECTION_PROGRESS_STATUS,
} from '@pripremi-se/shared';
import type { Id } from './_generated/dataModel';
import { authedZodMutation, authedZodQuery, createTimestamps, updateTimestamp } from './lib';
import { now } from './lib/timestamps';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single lesson progress by ID.
 * Requires authentication - users can only view their own progress.
 */
export const getProgress = authedZodQuery({
	args: getLessonProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const progressId = args.id as Id<'lessonProgress'>;

		const progress = await db.get(progressId);
		if (!progress) {
			return null;
		}

		// Users can only view their own progress
		if (progress.userId !== user._id) {
			throw new Error('Not authorized to view this progress');
		}

		return progress;
	},
});

/**
 * Get user's progress for a specific lesson.
 * Requires authentication.
 */
export const getUserLessonProgress = authedZodQuery({
	args: getUserLessonProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const lessonId = args.lessonId as Id<'lessons'>;

		const progress = await db
			.query('lessonProgress')
			.withIndex('by_userId_lessonId', (q) => q.eq('userId', user._id).eq('lessonId', lessonId))
			.first();

		return progress;
	},
});

/**
 * List user's lesson progress with optional filters.
 * Requires authentication.
 */
export const getUserProgress = authedZodQuery({
	args: listUserLessonProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const { status } = args;

		// If filtering by status, we need to filter in memory since we don't have a by_userId_status index
		const allProgress = await db
			.query('lessonProgress')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.collect();

		if (status) {
			return allProgress.filter((p) => p.status === status);
		}

		return allProgress;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Start or get existing lesson progress.
 * Creates a new progress record on first access, returns existing if already started.
 * Requires authentication.
 */
export const startOrGetProgress = authedZodMutation({
	args: startLessonProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const lessonId = args.lessonId as Id<'lessons'>;

		// Verify lesson exists and is active
		const lesson = await db.get(lessonId);
		if (!lesson) {
			throw new Error('Lesson not found');
		}
		if (!lesson.isActive) {
			throw new Error('Lesson is not available');
		}

		// Check for existing progress
		const existingProgress = await db
			.query('lessonProgress')
			.withIndex('by_userId_lessonId', (q) => q.eq('userId', user._id).eq('lessonId', lessonId))
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

		// Create new progress record
		const currentTime = now();
		const progressId = await db.insert('lessonProgress', {
			userId: user._id,
			lessonId,
			status: LESSON_PROGRESS_STATUS.IN_PROGRESS,
			timeSpent: 0,
			lastAccessedAt: currentTime,
			...createTimestamps(),
		});

		return progressId;
	},
});

/**
 * Update lesson progress (e.g., tracking time spent).
 * Requires authentication.
 */
export const updateProgress = authedZodMutation({
	args: updateLessonProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const progressId = args.id as Id<'lessonProgress'>;

		const progress = await db.get(progressId);
		if (!progress) {
			throw new Error('Progress not found');
		}

		// Users can only update their own progress
		if (progress.userId !== user._id) {
			throw new Error('Not authorized to update this progress');
		}

		const currentTime = now();
		await db.patch(progressId, {
			timeSpent: args.timeSpent,
			lastAccessedAt: currentTime,
			...updateTimestamp(),
		});

		return progressId;
	},
});

/**
 * Complete a lesson.
 * Requires authentication.
 * Also updates section progress counts.
 */
export const completeProgress = authedZodMutation({
	args: completeLessonProgressSchema,
	handler: async (ctx, args) => {
		const { db, user } = ctx;
		const progressId = args.id as Id<'lessonProgress'>;

		const progress = await db.get(progressId);
		if (!progress) {
			throw new Error('Progress not found');
		}

		// Users can only complete their own progress
		if (progress.userId !== user._id) {
			throw new Error('Not authorized to complete this progress');
		}

		// Can only complete in_progress lessons
		if (progress.status !== LESSON_PROGRESS_STATUS.IN_PROGRESS) {
			throw new Error('Lesson is already completed');
		}

		const currentTime = now();
		await db.patch(progressId, {
			status: LESSON_PROGRESS_STATUS.COMPLETED,
			completedAt: currentTime,
			lastAccessedAt: currentTime,
			...(args.timeSpent !== undefined && { timeSpent: args.timeSpent }),
			...updateTimestamp(),
		});

		// Sync section progress
		const lesson = await db.get(progress.lessonId);
		if (lesson) {
			const sectionProgress = await db
				.query('sectionProgress')
				.withIndex('by_userId_sectionId', (q) => q.eq('userId', user._id).eq('sectionId', lesson.sectionId))
				.first();

			if (sectionProgress) {
				// Count completed lessons in this section
				const activeSectionLessons = await db.query('lessons').withIndex('by_isActive_sectionId_order', (q) => q.eq('isActive', true).eq('sectionId', lesson.sectionId)).collect();

				const lessonProgressRecords = await Promise.all(
					activeSectionLessons.map((l) =>
						db
							.query('lessonProgress')
							.withIndex('by_userId_lessonId', (q) => q.eq('userId', user._id).eq('lessonId', l._id))
							.first()
					)
				);

				const completedCount = lessonProgressRecords.filter((lp) => lp?.status === LESSON_PROGRESS_STATUS.COMPLETED).length;

				const updateData: Record<string, unknown> = {
					lessonsCompleted: completedCount,
					totalLessons: activeSectionLessons.length,
					...updateTimestamp(),
				};

				// Auto-complete section if all lessons done and test passed (or no test)
				if (completedCount >= activeSectionLessons.length && activeSectionLessons.length > 0) {
					const test = await db.query('tests').withIndex('by_sectionId', (q) => q.eq('sectionId', lesson.sectionId)).first();

					if (!test || sectionProgress.testPassed) {
						updateData.status = SECTION_PROGRESS_STATUS.COMPLETED;
						updateData.completedAt = currentTime;
					}
				}

				await db.patch(sectionProgress._id, updateData);
			}
		}

		return progressId;
	},
});
