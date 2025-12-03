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
});
