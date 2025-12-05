import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireActionCtx, requireMutationCtx } from "@convex-dev/better-auth/utils";
import { getOneFrom } from "convex-helpers/server/relationships";
import { betterAuth } from "better-auth";
import { USER_ROLES } from "@pripremi-se/shared";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authSchema from "./betterAuth/schema";
import { sendChangeEmailVerification, sendEmailVerification, sendResetPassword } from "./email";
import { createTimestamps } from "./lib/timestamps";

const siteUrl = process.env.SITE_URL || "http://localhost:3000";

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth,
	{
    local: {
      schema: authSchema,
    },
  }
);

export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false }
) => {
	return betterAuth({
		logger: {
			disabled: optionsOnly,
		},
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // Refresh every 24 hours
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes
			},
			freshAge: 60 * 10, // 10 minutes - session is "fresh" for sensitive actions
		},
		advanced: {
			useSecureCookies: process.env.NODE_ENV === "production",
			defaultCookieAttributes: {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
			},
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						if (optionsOnly) return;

						try {
							const mutationCtx = requireMutationCtx(ctx);

							// Defensive check - skip if profile already exists
							const existingProfile = await getOneFrom(
								mutationCtx.db,
								"userProfiles",
								"by_userId",
								user.id
							);

							if (existingProfile) return;

							// Create user profile with default USER role
							await mutationCtx.db.insert("userProfiles", {
								userId: user.id,
								displayName: user.name || "User",
								role: USER_ROLES.USER,
								...createTimestamps(),
							});
						} catch (error) {
							// Log but don't throw - profile can be created lazily later via updateMyProfile
							console.error(`Failed to create profile for user ${user.id}:`, error);
						}
					},
				},
				update: {
					after: async (user) => {
						if (optionsOnly) return;

						try {
							const mutationCtx = requireMutationCtx(ctx);
							const profile = await getOneFrom(
								mutationCtx.db,
								"userProfiles",
								"by_userId",
								user.id
							);

							// Sync displayName if user.name changed
							if (profile && user.name && profile.displayName !== user.name) {
								await mutationCtx.db.patch(profile._id, {
									displayName: user.name,
									updatedAt: Date.now(),
								});
							}
						} catch (error) {
							console.error(`Failed to sync profile for user ${user.id}:`, error);
						}
					},
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			autoSignIn: true,
			sendResetPassword: async ({ user, url }) => {
				await sendResetPassword(requireActionCtx(ctx), {
					to: user.email,
					url,
					studentName: user.name,
					expirationTime: "10",
				});
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, token }) => {
				await sendEmailVerification(requireActionCtx(ctx), {
					to: user.email,
					token,
					studentName: user.name,
				});
			},
			verificationTokenExpiresIn: 86_400, // 24 hours in seconds
			async afterEmailVerification(_user, _request) {
				// Email verification completed successfully
			}
		},
		user: {
			changeEmail: {
				enabled: true,
				sendChangeEmailVerification: async ({ user, newEmail, url }) => {
					await sendChangeEmailVerification(requireActionCtx(ctx), {
						to: user.email,
						studentName: user.name,
						newEmail,
						url,
					});
				},
			},
			deleteUser: {
				enabled: true,
			},
		},
		rateLimit: {
			enabled: true,
			storage: "database",
			window: 60,
			max: 100,
			customRules: {
				"/sign-in/email": {
					window: 10,
					max: 3,
				},
				"/change-password": {
					window: 60,
					max: 5,
				},
				"/delete-user": {
					window: 300,
					max: 3,
				},
				"/change-email": {
					window: 60,
					max: 3,
				},
				"/send-verification-email": {
					window: 60,
					max: 1,
				},
			},
		},
		plugins: [convex({ jwtExpirationSeconds: 900 })], // 15 min JWT expiration
	});
};