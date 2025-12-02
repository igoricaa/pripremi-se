import { v } from 'convex/values';
import { getOneFrom } from 'convex-helpers/server/relationships';
import { authedMutation } from './lib/functions';
import { createTimestamps, updateTimestamp } from './lib/timestamps';

export const updateMyProfile = authedMutation({
	args: {
		displayName: v.string(),
		location: v.optional(v.string()),
	},
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
			role: 'user',
			...createTimestamps(),
		});
	},
});
