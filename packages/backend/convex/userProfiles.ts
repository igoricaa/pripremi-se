import { authedZodMutation } from './lib/functions';
import { profileUpdateSchema } from '@pripremi-se/shared';
import { createTimestamps, updateTimestamp } from './lib/timestamps';
import { getOneFrom } from 'convex-helpers/server/relationships';

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
			role: 'user',
			...createTimestamps(),
		});
	},
});
