import { authedQuery, authedZodMutation } from './lib/functions';
import { profileUpdateSchema, USER_ROLES } from '@pripremi-se/shared';
import { createTimestamps, updateTimestamp } from './lib/timestamps';
import { getOneFrom } from 'convex-helpers/server/relationships';


// ============================================================================
// QUERIES
// ============================================================================

export const getCurrentUserProfile = authedQuery({
	args: {},
	handler: async (ctx) => {
		const { user, db } = ctx;
		return await getOneFrom(db, 'userProfiles', 'by_userId', user._id);
	}
})

/**
 * Check if the current user has admin role.
 * Returns true if user is admin, false otherwise.
 */
export const isAdmin = authedQuery({
	args: {},
	handler: async (ctx) => {
		const { user, db } = ctx;
		const profile = await getOneFrom(db, 'userProfiles', 'by_userId', user._id);
		return profile?.role === USER_ROLES.ADMIN;
	}
})

/**
 * Check if the current user can access curriculum (editor or admin).
 * Returns true if user is editor or admin, false otherwise.
 */
export const canAccessCurriculum = authedQuery({
	args: {},
	handler: async (ctx) => {
		const { user, db } = ctx;
		const profile = await getOneFrom(db, 'userProfiles', 'by_userId', user._id);
		return profile?.role === USER_ROLES.ADMIN || profile?.role === USER_ROLES.EDITOR;
	}
})

/**
 * Get the current user's role.
 * Returns the role string or null if profile doesn't exist.
 */
export const getCurrentUserRole = authedQuery({
	args: {},
	handler: async (ctx) => {
		const { user, db } = ctx;
		const profile = await getOneFrom(db, 'userProfiles', 'by_userId', user._id);
		return profile?.role ?? null;
	}
})

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update the current user's profile.
 * Requires authentication.
 */
export const updateMyProfile = authedZodMutation({
	args: profileUpdateSchema,
	handler: async (ctx, args) => {
		const { user, db } = ctx;

		const existingProfile = await getOneFrom(
			db,
			'userProfiles',
			'by_userId',
			user._id
		);

		if (existingProfile) {
			await db.patch(existingProfile._id, {
				...args,
				...updateTimestamp(),
			});
			return existingProfile._id;
		}

		return await db.insert('userProfiles', {
			userId: user._id,
			...args,
			role: USER_ROLES.USER,
			...createTimestamps(),
		});
	},
});
