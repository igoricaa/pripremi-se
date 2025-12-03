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
		return await getOneFrom(db, 'userProfiles', 'by_authId', user._id);
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
			'by_authId',
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
			authId: user._id,
			...args,
			role: USER_ROLES.USER,
			...createTimestamps(),
		});
	},
});
