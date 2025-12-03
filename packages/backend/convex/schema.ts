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
		.index('by_isActive_sectionId_order', ['isActive', 'sectionId', 'order']),

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
});
