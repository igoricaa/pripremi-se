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
});
