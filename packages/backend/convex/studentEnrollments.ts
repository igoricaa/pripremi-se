import type { Id } from './_generated/dataModel';
import { authedZodMutation, authedZodQuery } from './lib/functions';
import { createTimestamps, updateTimestamp } from './lib/timestamps';
import {
	ENROLLMENT_STATUS,
	enrollInSubjectSchema,
	updateEnrollmentStatusSchema,
	pauseEnrollmentSchema,
	resumeEnrollmentSchema,
	completeEnrollmentSchema,
	updateEnrollmentAccessSchema,
	unenrollSchema,
	getEnrollmentByIdSchema,
	checkEnrollmentSchema,
	listMyEnrollmentsSchema,
	getRecentlyAccessedSchema,
	getSubjectEnrollmentStatsSchema,
} from '@pripremi-se/shared';

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Enroll in a subject
 * Creates a new enrollment with status "active"
 */
export const enrollInSubject = authedZodMutation({
	args: enrollInSubjectSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const subjectId = args.subjectId as Id<'subjects'>;

		// Verify subject exists
		const subject = await db.get(subjectId);
		if (!subject) {
			throw new Error('Subject not found');
		}

		// Check if already enrolled (enforce uniqueness)
		const existing = await db
			.query('studentEnrollments')
			.withIndex('by_userId_subjectId', (q) =>
				q.eq('userId', user._id).eq('subjectId', subjectId)
			)
			.first();

		if (existing) {
			throw new Error('Already enrolled in this subject');
		}

		// Create enrollment
		const enrollmentId = await db.insert('studentEnrollments', {
			userId: user._id,
			subjectId,
			status: ENROLLMENT_STATUS.ACTIVE,
			...createTimestamps(),
		});

		return enrollmentId;
	},
});

/**
 * Update enrollment status
 * Generic status update (use specific methods like pause/resume/complete when possible)
 */
export const updateEnrollmentStatus = authedZodMutation({
	args: updateEnrollmentStatusSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const enrollmentId = args.id as Id<'studentEnrollments'>;

		const enrollment = await db.get(enrollmentId);
		if (!enrollment) {
			throw new Error('Enrollment not found');
		}

		// Verify ownership
		if (enrollment.userId !== user._id) {
			throw new Error('Not authorized to update this enrollment');
		}

		const updateData: Record<string, unknown> = {
			status: args.status,
			...updateTimestamp(),
		};

		// Set completedAt if completing
		if (args.status === ENROLLMENT_STATUS.COMPLETED && !enrollment.completedAt) {
			updateData.completedAt = Date.now();
		}

		await db.patch(enrollmentId, updateData);
		return enrollmentId;
	},
});

/**
 * Pause an enrollment
 * Only active enrollments can be paused
 */
export const pauseEnrollment = authedZodMutation({
	args: pauseEnrollmentSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const enrollmentId = args.id as Id<'studentEnrollments'>;

		const enrollment = await db.get(enrollmentId);
		if (!enrollment) {
			throw new Error('Enrollment not found');
		}

		if (enrollment.userId !== user._id) {
			throw new Error('Not authorized to update this enrollment');
		}

		if (enrollment.status !== ENROLLMENT_STATUS.ACTIVE) {
			throw new Error('Only active enrollments can be paused');
		}

		await db.patch(enrollmentId, {
			status: ENROLLMENT_STATUS.PAUSED,
			...updateTimestamp(),
		});

		return enrollmentId;
	},
});

/**
 * Resume a paused enrollment
 * Only paused enrollments can be resumed
 */
export const resumeEnrollment = authedZodMutation({
	args: resumeEnrollmentSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const enrollmentId = args.id as Id<'studentEnrollments'>;

		const enrollment = await db.get(enrollmentId);
		if (!enrollment) {
			throw new Error('Enrollment not found');
		}

		if (enrollment.userId !== user._id) {
			throw new Error('Not authorized to update this enrollment');
		}

		if (enrollment.status !== ENROLLMENT_STATUS.PAUSED) {
			throw new Error('Only paused enrollments can be resumed');
		}

		await db.patch(enrollmentId, {
			status: ENROLLMENT_STATUS.ACTIVE,
			...updateTimestamp(),
		});

		return enrollmentId;
	},
});

/**
 * Complete an enrollment
 * Marks the enrollment as completed with timestamp
 */
export const completeEnrollment = authedZodMutation({
	args: completeEnrollmentSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const enrollmentId = args.id as Id<'studentEnrollments'>;

		const enrollment = await db.get(enrollmentId);
		if (!enrollment) {
			throw new Error('Enrollment not found');
		}

		if (enrollment.userId !== user._id) {
			throw new Error('Not authorized to update this enrollment');
		}

		if (enrollment.status === ENROLLMENT_STATUS.COMPLETED) {
			throw new Error('Enrollment is already completed');
		}

		await db.patch(enrollmentId, {
			status: ENROLLMENT_STATUS.COMPLETED,
			completedAt: Date.now(),
			...updateTimestamp(),
		});

		return enrollmentId;
	},
});

/**
 * Update last accessed timestamp
 * Called when user opens subject content
 */
export const updateLastAccessed = authedZodMutation({
	args: updateEnrollmentAccessSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const subjectId = args.subjectId as Id<'subjects'>;

		// Find enrollment by user and subject
		const enrollment = await db
			.query('studentEnrollments')
			.withIndex('by_userId_subjectId', (q) =>
				q.eq('userId', user._id).eq('subjectId', subjectId)
			)
			.first();

		if (!enrollment) {
			throw new Error('Enrollment not found');
		}

		await db.patch(enrollment._id, {
			lastAccessedAt: Date.now(),
			...updateTimestamp(),
		});

		return enrollment._id;
	},
});

/**
 * Unenroll from a subject
 * Permanently deletes the enrollment
 */
export const unenroll = authedZodMutation({
	args: unenrollSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const enrollmentId = args.id as Id<'studentEnrollments'>;

		const enrollment = await db.get(enrollmentId);
		if (!enrollment) {
			throw new Error('Enrollment not found');
		}

		if (enrollment.userId !== user._id) {
			throw new Error('Not authorized to delete this enrollment');
		}

		await db.delete(enrollmentId);
		return { success: true };
	},
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get enrollment by ID
 */
export const getEnrollmentById = authedZodQuery({
	args: getEnrollmentByIdSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const enrollmentId = args.id as Id<'studentEnrollments'>;

		const enrollment = await db.get(enrollmentId);
		if (!enrollment) {
			return null;
		}

		// Verify ownership
		if (enrollment.userId !== user._id) {
			throw new Error('Not authorized to view this enrollment');
		}

		return enrollment;
	},
});

/**
 * Check if current user is enrolled in a subject
 * Returns the enrollment if exists, null otherwise
 */
export const checkEnrollment = authedZodQuery({
	args: checkEnrollmentSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;
		const subjectId = args.subjectId as Id<'subjects'>;

		const enrollment = await db
			.query('studentEnrollments')
			.withIndex('by_userId_subjectId', (q) =>
				q.eq('userId', user._id).eq('subjectId', subjectId)
			)
			.first();

		return enrollment;
	},
});

/**
 * List current user's enrollments
 * Optionally filter by status
 */
export const listMyEnrollments = authedZodQuery({
	args: listMyEnrollmentsSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;

		let enrollments;

		if (args.status) {
			enrollments = await db
				.query('studentEnrollments')
				.withIndex('by_userId_status', (q) =>
					q.eq('userId', user._id).eq('status', args.status as string)
				)
				.collect();
		} else {
			enrollments = await db
				.query('studentEnrollments')
				.withIndex('by_userId', (q) => q.eq('userId', user._id))
				.collect();
		}

		// Enrich with subject data
		const enrichedEnrollments = await Promise.all(
			enrollments.map(async (enrollment) => {
				const subject = await db.get(enrollment.subjectId);
				return { ...enrollment, subject };
			})
		);

		return enrichedEnrollments;
	},
});

/**
 * Get user's recently accessed subjects
 * Returns enrollments sorted by lastAccessedAt (most recent first)
 */
export const getRecentlyAccessed = authedZodQuery({
	args: getRecentlyAccessedSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;

		// Get all enrollments for user that have been accessed
		const enrollments = await db
			.query('studentEnrollments')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.collect();

		// Filter to only those with lastAccessedAt and sort
		const accessedEnrollments = enrollments
			.filter((e) => e.lastAccessedAt !== undefined)
			.sort((a, b) => (b.lastAccessedAt ?? 0) - (a.lastAccessedAt ?? 0))
			.slice(0, args.limit);

		// Enrich with subject data
		const enrichedEnrollments = await Promise.all(
			accessedEnrollments.map(async (enrollment) => {
				const subject = await db.get(enrollment.subjectId);
				return { ...enrollment, subject };
			})
		);

		return enrichedEnrollments;
	},
});

/**
 * Get enrollment statistics for a subject (admin)
 * Returns counts by status
 */
export const getSubjectEnrollmentStats = authedZodQuery({
	args: getSubjectEnrollmentStatsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const subjectId = args.subjectId as Id<'subjects'>;

		// Verify subject exists
		const subject = await db.get(subjectId);
		if (!subject) {
			throw new Error('Subject not found');
		}

		// Get all enrollments for this subject
		const enrollments = await db
			.query('studentEnrollments')
			.withIndex('by_subjectId', (q) => q.eq('subjectId', subjectId))
			.collect();

		// Count by status
		const stats = {
			total: enrollments.length,
			active: 0,
			completed: 0,
			paused: 0,
		};

		for (const enrollment of enrollments) {
			if (enrollment.status === ENROLLMENT_STATUS.ACTIVE) {
				stats.active++;
			} else if (enrollment.status === ENROLLMENT_STATUS.COMPLETED) {
				stats.completed++;
			} else if (enrollment.status === ENROLLMENT_STATUS.PAUSED) {
				stats.paused++;
			}
		}

		return stats;
	},
});
