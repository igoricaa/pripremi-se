import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	userProfiles: defineTable({
		authId: v.string(),
		displayName: v.string(),
		location: v.optional(v.string()),
		role: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_authId', ['authId'])
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

		// Metadata
		isActive: v.boolean(), // Whether question is published
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_isActive', ['isActive'])
		.index('by_type', ['type'])
		.index('by_lessonId', ['lessonId'])
		.index('by_difficulty', ['difficulty']),

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
});
