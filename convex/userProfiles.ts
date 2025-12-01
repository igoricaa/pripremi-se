import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const updateMyProfile = mutation({
  args: {
    displayName: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_authId", (q) => q.eq("authId", user._id))
      .first();

    const now = Date.now();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        displayName: args.displayName,
        location: args.location,
        updatedAt: now,
      });
      return existingProfile._id;
    }

    return await ctx.db.insert("userProfiles", {
      authId: user._id,
      displayName: args.displayName,
      location: args.location,
      role: "user",
      createdAt: now,
      updatedAt: now,
    });
  },
});
