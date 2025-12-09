import { z } from 'zod';
import { enrollmentStatusEnum } from '../constants/enrollment-status';

// ============================================================================
// MUTATION SCHEMAS
// ============================================================================

/**
 * Schema for enrolling in a subject
 */
export const enrollInSubjectSchema = z.object({
	subjectId: z.string().min(1, 'Subject ID is required'),
});

export type EnrollInSubjectInput = z.infer<typeof enrollInSubjectSchema>;

/**
 * Schema for updating enrollment status
 */
export const updateEnrollmentStatusSchema = z.object({
	id: z.string().min(1, 'Enrollment ID is required'),
	status: enrollmentStatusEnum,
});

export type UpdateEnrollmentStatusInput = z.infer<
	typeof updateEnrollmentStatusSchema
>;

/**
 * Schema for pausing an enrollment
 */
export const pauseEnrollmentSchema = z.object({
	id: z.string().min(1, 'Enrollment ID is required'),
});

export type PauseEnrollmentInput = z.infer<typeof pauseEnrollmentSchema>;

/**
 * Schema for resuming a paused enrollment
 */
export const resumeEnrollmentSchema = z.object({
	id: z.string().min(1, 'Enrollment ID is required'),
});

export type ResumeEnrollmentInput = z.infer<typeof resumeEnrollmentSchema>;

/**
 * Schema for completing an enrollment
 */
export const completeEnrollmentSchema = z.object({
	id: z.string().min(1, 'Enrollment ID is required'),
});

export type CompleteEnrollmentInput = z.infer<typeof completeEnrollmentSchema>;

/**
 * Schema for updating last accessed timestamp (by subject)
 */
export const updateEnrollmentAccessSchema = z.object({
	subjectId: z.string().min(1, 'Subject ID is required'),
});

export type UpdateEnrollmentAccessInput = z.infer<
	typeof updateEnrollmentAccessSchema
>;

/**
 * Schema for unenrolling from a subject
 */
export const unenrollSchema = z.object({
	id: z.string().min(1, 'Enrollment ID is required'),
});

export type UnenrollInput = z.infer<typeof unenrollSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for getting an enrollment by ID
 */
export const getEnrollmentByIdSchema = z.object({
	id: z.string().min(1, 'Enrollment ID is required'),
});

export type GetEnrollmentByIdInput = z.infer<typeof getEnrollmentByIdSchema>;

/**
 * Schema for checking if user is enrolled in a subject
 */
export const checkEnrollmentSchema = z.object({
	subjectId: z.string().min(1, 'Subject ID is required'),
});

export type CheckEnrollmentInput = z.infer<typeof checkEnrollmentSchema>;

/**
 * Schema for listing user's enrollments with optional status filter
 */
export const listMyEnrollmentsSchema = z.object({
	status: enrollmentStatusEnum.optional(),
});

export type ListMyEnrollmentsInput = z.infer<typeof listMyEnrollmentsSchema>;

/**
 * Schema for getting recently accessed subjects
 */
export const getRecentlyAccessedSchema = z.object({
	limit: z.number().int('Limit must be an integer').min(1).max(20).default(5),
});

export type GetRecentlyAccessedInput = z.infer<
	typeof getRecentlyAccessedSchema
>;

/**
 * Schema for getting subject enrollment statistics (admin)
 */
export const getSubjectEnrollmentStatsSchema = z.object({
	subjectId: z.string().min(1, 'Subject ID is required'),
});

export type GetSubjectEnrollmentStatsInput = z.infer<
	typeof getSubjectEnrollmentStatsSchema
>;
