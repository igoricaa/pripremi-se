
import { query } from "./_generated/server";
import { authComponent } from "./auth";

export const getCurrentAuthUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});

export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    return ctx.auth.getUserIdentity();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
      return null;
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_authId", (q) => q.eq("authId", user._id))
      .first();

    if (!userProfile) {
      return {
        user,
        userProfile: null,
      };
    }

    return {
      user,
      userProfile
    };
  },
});
