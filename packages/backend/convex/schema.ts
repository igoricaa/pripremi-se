import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	userProfiles: defineTable({
		userId: v.string(), // Better Auth user ID
		displayName: v.string(),
		location: v.optional(v.string()),
		role: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_userId', ['userId'])
		.index('by_location', ['location']),

	// Curriculum: Subjects (root of curriculum hierarchy)
	subjects: defineTable({
		name: v.string(), // Subject name (e.g., "Matematika", "Srpski jezik")
		slug: v.string(), // URL-friendly identifier
		description: v.string(), // Subject description
		icon: v.optional(v.string()), // Icon identifier or URL
		order: v.number(), // Display order
		isActive: v.boolean(), // Whether subject is published
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_slug', ['slug'])
		.index('by_order', ['order'])
		.index('by_isActive', ['isActive'])
		.index('by_isActive_order', ['isActive', 'order']),

	chapters: defineTable({
		subjectId: v.id('subjects'),
		name: v.string(),
		slug: v.string(),
		description: v.string(),
		order: v.number(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_subjectId', ['subjectId'])
		.index('by_slug', ['slug'])
		.index('by_isActive', ['isActive'])
		.index('by_isActive_order', ['isActive', 'order'])
		.index('by_subjectId_order', ['subjectId', 'order'])
		.index('by_isActive_subjectId_order', ['isActive', 'subjectId', 'order']),

	// Curriculum: Sections (sub-units within chapters)
	sections: defineTable({
		chapterId: v.id('chapters'), // Reference to parent chapter
		name: v.string(), // Section title
		slug: v.string(), // URL-friendly identifier
		description: v.optional(v.string()), // Section overview (optional)
		order: v.number(), // Display order within chapter
		isActive: v.boolean(), // Whether section is published
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_chapterId', ['chapterId'])
		.index('by_slug', ['slug'])
		.index('by_isActive', ['isActive'])
		.index('by_isActive_order', ['isActive', 'order'])
		.index('by_chapterId_order', ['chapterId', 'order'])
		.index('by_isActive_chapterId_order', ['isActive', 'chapterId', 'order']),

	// Curriculum: Lessons (learning content within sections)
	lessons: defineTable({
		sectionId: v.id('sections'), // Reference to parent section
		title: v.string(), // Lesson title
		slug: v.string(), // URL-friendly identifier
		content: v.string(), // Rich text/markdown content
		contentType: v.string(), // "text", "video", "interactive"
		estimatedMinutes: v.number(), // Estimated reading/viewing time
		practiceTestId: v.optional(v.id('tests')), // Optional practice test at lesson end
		order: v.number(), // Display order within section
		isActive: v.boolean(), // Whether lesson is published
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_sectionId', ['sectionId'])
		.index('by_slug', ['slug'])
		.index('by_isActive', ['isActive'])
		.index('by_isActive_order', ['isActive', 'order'])
		.index('by_sectionId_order', ['sectionId', 'order'])
		.index('by_isActive_sectionId_order', ['isActive', 'sectionId', 'order'])
		.index('by_practiceTestId', ['practiceTestId']),

	// Lesson Files: Media and attachments for lessons
	lessonFiles: defineTable({
		lessonId: v.id('lessons'), // Reference to parent lesson
		storageId: v.id('_storage'), // Reference to Convex file storage
		fileName: v.string(), // Original file name
		fileType: v.string(), // "image", "video", "pdf", "audio"
		mimeType: v.string(), // MIME type (e.g., "image/png", "video/mp4")
		fileSize: v.number(), // File size in bytes
		altText: v.optional(v.string()), // Alt text for accessibility (mainly for images)
		createdAt: v.number(),
	})
		.index('by_lessonId', ['lessonId'])
		.index('by_storageId', ['storageId']),

	// Assessment: Tests (quizzes/exams that can be linked to any curriculum level)
	tests: defineTable({
		title: v.string(), // Test title
		slug: v.string(), // URL-friendly identifier
		description: v.string(), // Test description

		// Flexible curriculum linking (only ONE can be set, or none for standalone tests)
		subjectId: v.optional(v.id('subjects')), // Link to subject
		chapterId: v.optional(v.id('chapters')), // Link to chapter
		sectionId: v.optional(v.id('sections')), // Link to section

		// Test configuration
		timeLimit: v.optional(v.number()), // Time limit in minutes (null = no limit)
		passingScore: v.number(), // Passing score percentage (0-100)
		maxAttempts: v.optional(v.number()), // Maximum attempts allowed (null = unlimited)
		shuffleQuestions: v.boolean(), // Whether to randomize question order
		showCorrectAnswers: v.boolean(), // Whether to show correct answers after completion

		// Metadata
		order: v.number(), // Display order
		isActive: v.boolean(), // Whether test is published
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_slug', ['slug'])
		.index('by_order', ['order'])
		.index('by_isActive', ['isActive'])
		.index('by_isActive_order', ['isActive', 'order'])
		.index('by_subjectId', ['subjectId'])
		.index('by_chapterId', ['chapterId'])
		.index('by_sectionId', ['sectionId'])
		.index('by_isActive_subjectId', ['isActive', 'subjectId'])
		.index('by_isActive_chapterId', ['isActive', 'chapterId'])
		.index('by_isActive_sectionId', ['isActive', 'sectionId']),

	// Assessment: Questions (all questions are reusable by default, linked via junction table)
	questions: defineTable({
		text: v.string(), // Question text
		explanation: v.optional(v.string()), // Explanation for correct answer

		type: v.string(), // Question type: "single_choice", "multiple_choice", "true_false", "short_answer", "essay"

		// Scoring
		points: v.number(), // Points for this question
		allowPartialCredit: v.boolean(), // Whether to allow partial credit (for multiple_choice)

		// Educational linking and categorization
		lessonId: v.optional(v.id('lessons')), // Link to lesson for "Learn More" when answer is incorrect
		difficulty: v.optional(v.string()), // Question difficulty: "easy", "medium", "hard"

		// Denormalized hierarchy fields for efficient filtering
		sectionId: v.optional(v.id('sections')), // Auto-populated from lessonId
		chapterId: v.optional(v.id('chapters')), // Auto-populated from lessonId
		subjectId: v.optional(v.id('subjects')), // Auto-populated from lessonId

		// Metadata
		isActive: v.boolean(), // Whether question is published
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_isActive', ['isActive'])
		.index('by_type', ['type'])
		.index('by_lessonId', ['lessonId'])
		.index('by_difficulty', ['difficulty'])
		// Hierarchy indexes for filtering
		.index('by_subjectId', ['subjectId'])
		.index('by_chapterId', ['chapterId'])
		.index('by_sectionId', ['sectionId'])
		// Composite indexes for multi-filter queries (most common patterns)
		.index('by_subjectId_type', ['subjectId', 'type'])
		.index('by_chapterId_type', ['chapterId', 'type'])
		.index('by_sectionId_type', ['sectionId', 'type'])
		.index('by_lessonId_type', ['lessonId', 'type'])
		.index('by_type_difficulty', ['type', 'difficulty'])
		// Full-text search index for question text with filter fields
		.searchIndex('search_text', {
			searchField: 'text',
			filterFields: ['type', 'difficulty', 'subjectId', 'chapterId', 'sectionId', 'lessonId', 'isActive'],
		}),

	// Assessment: Question Options (answer choices for multiple choice/true-false questions)
	questionOptions: defineTable({
		questionId: v.id('questions'), // Reference to parent question
		text: v.string(), // Option text
		isCorrect: v.boolean(), // Whether this option is correct
		order: v.number(), // Display order
		createdAt: v.number(),
	})
		.index('by_questionId', ['questionId'])
		.index('by_questionId_order', ['questionId', 'order']),

	// Assessment: Test-Questions Junction (many-to-many relationship)
	testQuestions: defineTable({
		testId: v.id('tests'), // Test containing this question
		questionId: v.id('questions'), // Question in this test
		order: v.number(), // Display order within test
		createdAt: v.number(),
	})
		.index('by_testId', ['testId'])
		.index('by_questionId', ['questionId'])
		.index('by_testId_order', ['testId', 'order'])
		.index('by_testId_questionId', ['testId', 'questionId']), // Uniqueness check

	// Assessment: Test Attempts (tracks student test submissions)
	testAttempts: defineTable({
		userId: v.string(), // Better Auth user ID
		testId: v.id('tests'), // Reference to test taken
		score: v.number(), // Score achieved (percentage 0-100)
		correctCount: v.number(), // Number of correct answers
		totalQuestions: v.number(), // Total questions in test
		timeSpent: v.number(), // Time spent in seconds
		status: v.string(), // "in_progress", "completed", "abandoned"
		startedAt: v.number(), // When attempt started
		completedAt: v.optional(v.number()), // When attempt finished
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_userId', ['userId'])
		.index('by_testId', ['testId'])
		.index('by_userId_testId', ['userId', 'testId'])
		.index('by_status', ['status'])
		.index('by_userId_status', ['userId', 'status'])
		.index('by_testId_score', ['testId', 'score']),

	// Assessment: Answer Responses (individual question answers within an attempt)
	answerResponses: defineTable({
		attemptId: v.id('testAttempts'), // Reference to parent attempt
		questionId: v.id('questions'), // Reference to question answered
		userId: v.string(), // Denormalized for RLS performance (Better Auth user ID)
		selectedOptionIds: v.optional(v.array(v.id('questionOptions'))), // For choice questions
		textAnswer: v.optional(v.string()), // For short_answer/essay questions
		isCorrect: v.boolean(), // Whether answer was correct
		pointsEarned: v.number(), // Points earned for this answer
		timeSpent: v.optional(v.number()), // Seconds spent on this question
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_attemptId', ['attemptId'])
		.index('by_questionId', ['questionId'])
		.index('by_attemptId_questionId', ['attemptId', 'questionId'])
		.index('by_userId', ['userId']),

	// Progress: Lesson Progress (tracks student progress through lessons)
	lessonProgress: defineTable({
		userId: v.string(), // Better Auth user ID
		lessonId: v.id('lessons'), // Reference to lesson
		status: v.string(), // "in_progress", "completed"
		timeSpent: v.number(), // Total seconds spent on lesson
		completedAt: v.optional(v.number()), // When lesson was marked complete
		lastAccessedAt: v.number(), // Last access timestamp
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_userId', ['userId'])
		.index('by_lessonId', ['lessonId'])
		.index('by_userId_lessonId', ['userId', 'lessonId'])
		.index('by_status', ['status'])
		.index('by_userId_status', ['userId', 'status']),

	// Student Enrollments (tracks which subjects students are enrolled in)
	studentEnrollments: defineTable({
		userId: v.string(), // Better Auth user ID
		subjectId: v.id('subjects'), // Reference to enrolled subject
		status: v.string(), // "active", "completed", "paused"
		completedAt: v.optional(v.number()), // When student completed subject
		lastAccessedAt: v.optional(v.number()), // Last time student accessed this subject
		createdAt: v.number(), // Enrollment timestamp
		updatedAt: v.number(),
	})
		.index('by_userId', ['userId'])
		.index('by_subjectId', ['subjectId'])
		.index('by_userId_subjectId', ['userId', 'subjectId'])
		.index('by_userId_status', ['userId', 'status'])
		.index('by_subjectId_status', ['subjectId', 'status'])
		.index('by_userId_lastAccessedAt', ['userId', 'lastAccessedAt'])
		.index('by_status', ['status']),

	// Progress: Section Progress (aggregated section-level progress)
	sectionProgress: defineTable({
		userId: v.string(), // Better Auth user ID
		sectionId: v.id('sections'), // Reference to section
		lessonsCompleted: v.number(), // Count of completed lessons (synced)
		totalLessons: v.number(), // Total lessons in section (synced)
		testPassed: v.boolean(), // Whether section test passed (auto-updated)
		bestTestScore: v.optional(v.number()), // Best test score achieved (0-100)
		status: v.string(), // "in_progress", "completed"
		completedAt: v.optional(v.number()), // When section was completed
		lastAccessedAt: v.number(), // Last access timestamp
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_userId', ['userId'])
		.index('by_sectionId', ['sectionId'])
		.index('by_userId_sectionId', ['userId', 'sectionId'])
		.index('by_userId_status', ['userId', 'status'])
		.index('by_sectionId_status', ['sectionId', 'status']),
});
