import { getOneFrom } from 'convex-helpers/server/relationships';
import { query, optionalAuthQuery } from './lib/functions';
import { authComponent } from './auth';

export const getCurrentAuthUser = query({
	args: {},
	handler: async (ctx) => authComponent.getAuthUser(ctx),
});

export const getCurrentUserId = query({
	args: {},
	handler: async (ctx) => ctx.auth.getUserIdentity(),
});

export const getCurrentUser = optionalAuthQuery({
	args: {},
	handler: async (ctx) => {
		const { user, db } = ctx;
		if (!user) return null;

		const userProfile = await getOneFrom(db, 'userProfiles', 'by_authId', user._id);
		return { user, userProfile: userProfile ?? null };
	},
});
