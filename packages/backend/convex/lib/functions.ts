import {
	customQuery,
	customMutation,
	customCtx,
} from 'convex-helpers/server/customFunctions';
import { zCustomMutation, zCustomQuery } from 'convex-helpers/server/zod4';
import {
	wrapDatabaseReader,
	wrapDatabaseWriter,
} from 'convex-helpers/server/rowLevelSecurity';
import { query, mutation } from '../_generated/server';
import {
	createRlsRules,
	getRequiredAuthContext,
	getOptionalAuthContext,
	rlsConfig,
} from './rls';

// ============================================================================
// PUBLIC FUNCTIONS (no auth, no RLS)
// ============================================================================

// Zod query WITHOUT authentication - validates args with Zod schema (public endpoints)
export const zodQuery = zCustomQuery(query, customCtx(async () => ({})));

// Zod mutation WITHOUT authentication - validates args with Zod schema (public endpoints)
export const zodMutation = zCustomMutation(
	mutation,
	customCtx(async () => ({}))
);

// ============================================================================
// AUTHENTICATED FUNCTIONS WITH RLS
// ============================================================================

// Authenticated query - injects ctx.user, returns null if not authenticated
export const optionalAuthQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const authCtx = await getOptionalAuthContext(ctx);

		// No user - return unwrapped db
		if (!authCtx.user) {
			return { user: null, db: ctx.db, rawDb: ctx.db };
		}

		// User exists - wrap with RLS
		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseReader(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Authenticated query - throws if not authenticated
export const authedQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		const rules = createRlsRules(authCtx);

		return {
			user: authCtx.user,
			db: wrapDatabaseReader(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Authenticated mutation - throws if not authenticated
export const authedMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		const rules = createRlsRules(authCtx);

		return {
			user: authCtx.user,
			db: wrapDatabaseWriter(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Zod query WITH authentication - validates args with Zod schema
export const authedZodQuery = zCustomQuery(
	query,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		const rules = createRlsRules(authCtx);

		return {
			user: authCtx.user,
			db: wrapDatabaseReader(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Zod mutation WITH authentication - validates args with Zod schema
export const authedZodMutation = zCustomMutation(
	mutation,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		const rules = createRlsRules(authCtx);

		return {
			user: authCtx.user,
			db: wrapDatabaseWriter(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// ============================================================================
// ADMIN-ONLY FUNCTIONS (with RLS for defense-in-depth)
// ============================================================================

// Admin-only query - throws if not authenticated or not admin
export const adminQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin) throw new Error('Admin access required');

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseReader(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Admin-only mutation - throws if not authenticated or not admin
export const adminMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin) throw new Error('Admin access required');

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseWriter(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Admin-only Zod query - validates args with Zod schema
export const adminZodQuery = zCustomQuery(
	query,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin) throw new Error('Admin access required');

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseReader(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Admin-only Zod mutation - validates args with Zod schema
export const adminZodMutation = zCustomMutation(
	mutation,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin) throw new Error('Admin access required');

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseWriter(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// ============================================================================
// EDITOR-LEVEL FUNCTIONS (Admin OR Editor, with RLS for defense-in-depth)
// ============================================================================

// Editor-level query - throws if not authenticated or not admin/editor
export const editorQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin && !authCtx.isEditor) {
			throw new Error('Editor access required');
		}

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseReader(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Editor-level mutation - throws if not authenticated or not admin/editor
export const editorMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin && !authCtx.isEditor) {
			throw new Error('Editor access required');
		}

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseWriter(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Editor-level Zod query - validates args with Zod schema
export const editorZodQuery = zCustomQuery(
	query,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin && !authCtx.isEditor) {
			throw new Error('Editor access required');
		}

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseReader(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Editor-level Zod mutation - validates args with Zod schema
export const editorZodMutation = zCustomMutation(
	mutation,
	customCtx(async (ctx) => {
		const authCtx = await getRequiredAuthContext(ctx);
		if (!authCtx.isAdmin && !authCtx.isEditor) {
			throw new Error('Editor access required');
		}

		const rules = createRlsRules(authCtx);
		return {
			user: authCtx.user,
			db: wrapDatabaseWriter(ctx, ctx.db, rules, rlsConfig),
			rawDb: ctx.db,
		};
	})
);

// Re-export base functions for non-authenticated use
export { query, mutation };
