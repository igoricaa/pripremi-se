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
    .index("by_authId", ["authId"])
    .index("by_location", ["location"])
});
