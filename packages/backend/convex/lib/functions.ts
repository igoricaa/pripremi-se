import {
	customQuery,
	customMutation,
	customCtx,
} from 'convex-helpers/server/customFunctions';
import { zCustomMutation, zCustomQuery } from 'convex-helpers/server/zod4';
import { query, mutation } from '../_generated/server';
import { authComponent } from '../auth';

// Authenticated query - injects ctx.user, returns null if not authenticated
export const optionalAuthQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		return { user: user ?? null };
	})
);

// Authenticated query - throws if not authenticated
export const authedQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		return { user };
	})
);

// Authenticated mutation - throws if not authenticated
export const authedMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		return { user };
	})
);

// Zod mutation WITH authentication - validates args with Zod schema
export const authedZodMutation = zCustomMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		return { user };
	})
);

// Zod query WITH authentication - validates args with Zod schema
export const authedZodQuery = zCustomQuery(
	query,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		return { user };
	})
);

// Re-export base functions for non-authenticated use
export { query, mutation };
