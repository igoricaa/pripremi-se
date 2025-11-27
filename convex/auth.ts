import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authSchema from "./betterAuth/schema";
import { sendEmailVerification, sendResetPassword } from "./email";

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
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			sendResetPassword: async ({ user, url }) => {
				await sendResetPassword(requireActionCtx(ctx), {
					to: user.email,
					url,
				});
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			// autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, token }) => {
				await sendEmailVerification(requireActionCtx(ctx), {
					to: user.email,
					token,
				});
			},
			verificationTokenExpiresIn: 86_400, // 24 hours in seconds
		},
		user: {
			deleteUser: {
				enabled: true,
			},
			// additionalFields: {
			//   hasCompletedOnboarding: {
			//     type: "boolean",
			//     required: false,
			//     defaultValue: false,
			//   },
			//   accountStatus: {
			//     type: "string",
			//     required: false,
			//     defaultValue: "active",
			//   },
			// },
		},
		plugins: [convex()],
	});
};