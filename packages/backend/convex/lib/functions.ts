import {
	customQuery,
	customMutation,
	customCtx,
} from 'convex-helpers/server/customFunctions';
import { zCustomMutation, zCustomQuery } from 'convex-helpers/server/zod4';
import { query, mutation } from '../_generated/server';
import { authComponent } from '../auth';
import { getOneFrom } from 'convex-helpers/server/relationships';
import { USER_ROLES } from '@pripremi-se/shared';

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

// Zod query WITHOUT authentication - validates args with Zod schema (public endpoints)
export const zodQuery = zCustomQuery(query, customCtx(async () => ({})));

// Zod mutation WITHOUT authentication - validates args with Zod schema (public endpoints)
export const zodMutation = zCustomMutation(mutation, customCtx(async () => ({})));

// ============================================================================
// ADMIN-ONLY FUNCTIONS
// ============================================================================

// Admin-only query - throws if not authenticated or not admin
export const adminQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN) {
			throw new Error('Admin access required');
		}
		return { user };
	})
);

// Admin-only mutation - throws if not authenticated or not admin
export const adminMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN) {
			throw new Error('Admin access required');
		}
		return { user };
	})
);

// Admin-only Zod query - validates args with Zod schema
export const adminZodQuery = zCustomQuery(
	query,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN) {
			throw new Error('Admin access required');
		}
		return { user };
	})
);

// Admin-only Zod mutation - validates args with Zod schema
export const adminZodMutation = zCustomMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN) {
			throw new Error('Admin access required');
		}
		return { user };
	})
);

// ============================================================================
// EDITOR-LEVEL FUNCTIONS (Admin OR Editor)
// ============================================================================

// Editor-level query - throws if not authenticated or not admin/editor
export const editorQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN && profile?.role !== USER_ROLES.EDITOR) {
			throw new Error('Editor access required');
		}
		return { user };
	})
);

// Editor-level mutation - throws if not authenticated or not admin/editor
export const editorMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN && profile?.role !== USER_ROLES.EDITOR) {
			throw new Error('Editor access required');
		}
		return { user };
	})
);

// Editor-level Zod query - validates args with Zod schema
export const editorZodQuery = zCustomQuery(
	query,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN && profile?.role !== USER_ROLES.EDITOR) {
			throw new Error('Editor access required');
		}
		return { user };
	})
);

// Editor-level Zod mutation - validates args with Zod schema
export const editorZodMutation = zCustomMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error('Not authenticated');
		const profile = await getOneFrom(ctx.db, 'userProfiles', 'by_userId', user._id);
		if (profile?.role !== USER_ROLES.ADMIN && profile?.role !== USER_ROLES.EDITOR) {
			throw new Error('Editor access required');
		}
		return { user };
	})
);

// Re-export base functions for non-authenticated use
export { query, mutation };
