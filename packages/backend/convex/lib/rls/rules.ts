import type { Rules } from 'convex-helpers/server/rowLevelSecurity';
import type { DataModel } from '../../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../../_generated/server';
import type { Doc } from '../../betterAuth/_generated/dataModel';
import { getOneFrom } from 'convex-helpers/server/relationships';
import { USER_ROLES } from '@pripremi-se/shared';
import { authComponent } from '../../auth';

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

/** Better Auth user type - derived from generated schema */
export type BetterAuthUser = Doc<'user'>;

/** Auth context where user may or may not be authenticated */
export type AuthCtx = {
	user: BetterAuthUser | null;
	isAdmin: boolean;
	isEditor: boolean;
};

/** Auth context where user is guaranteed to be authenticated */
export type AuthCtxWithUser = {
	user: BetterAuthUser;
	isAdmin: boolean;
	isEditor: boolean;
};

// ============================================================================
// AUTH CONTEXT FUNCTIONS
// ============================================================================

/**
 * Shared helper to build auth context from a known user.
 * Only fetches the profile once - eliminates duplicate DB calls.
 */
async function buildAuthContext(
	ctx: QueryCtx | MutationCtx,
	user: BetterAuthUser
): Promise<AuthCtxWithUser> {
	const profile = await getOneFrom(
		ctx.db,
		'userProfiles',
		'by_userId',
		user._id
	);
	return {
		user,
		isAdmin: profile?.role === USER_ROLES.ADMIN,
		isEditor: profile?.role === USER_ROLES.EDITOR,
	};
}

/**
 * Get auth context for REQUIRED authentication.
 * THROWS if not authenticated - use for endpoints that require auth.
 */
export async function getRequiredAuthContext(
	ctx: QueryCtx | MutationCtx
): Promise<AuthCtxWithUser> {
	const user = await authComponent.getAuthUser(ctx);
	if (!user) throw new Error('Not authenticated');
	return buildAuthContext(ctx, user);
}

/**
 * Get auth context for OPTIONAL authentication.
 * Returns null user if not authenticated - use for endpoints that work with or without auth.
 */
export async function getOptionalAuthContext(
	ctx: QueryCtx | MutationCtx
): Promise<AuthCtx> {
	const user = await authComponent.getAuthUser(ctx);
	if (!user) return { user: null, isAdmin: false, isEditor: false };
	return buildAuthContext(ctx, user);
}

export function createRlsRules(authCtx: AuthCtx): Rules<QueryCtx, DataModel> {
	const { user, isAdmin, isEditor } = authCtx;
	// NOTE: isEditor intentionally NOT used for user data - editors cannot see user data

	// Helper for user-owned tables
	// - Users can only access their own data
	// - Admins have FULL access (read + modify)
	// - Editors have NO access (they only manage content)
	const userOwnsRow = (field: string) => ({
		read: async (_: unknown, doc: Record<string, unknown>) => {
			if (!user) return false;
			if (isAdmin) return true;
			// Editors cannot read user data - only owner can
			return doc[field] === user._id;
		},
		insert: async (_: unknown, doc: Record<string, unknown>) => {
			if (!user) return false;
			if (isAdmin) return true;
			return doc[field] === user._id;
		},
		modify: async (_: unknown, doc: Record<string, unknown>) => {
			if (!user) return false;
			if (isAdmin) return true;
			return doc[field] === user._id;
		},
	});

	// Helper for content tables (public read, admin/editor write)
	const publicReadEditorWrite = {
		read: async () => true,
		insert: async () => isAdmin || isEditor,
		modify: async () => isAdmin || isEditor,
	};

	return {
		// =========================================================================
		// USER-OWNED TABLES - Owner OR Admin only (editors CANNOT access)
		// =========================================================================
		testAttempts: userOwnsRow('userId'),
		lessonProgress: userOwnsRow('userId'),
		sectionProgress: userOwnsRow('userId'),
		studentEnrollments: userOwnsRow('userId'),
		answerResponses: userOwnsRow('userId'),
		userProfiles: userOwnsRow('userId'),

		// =========================================================================
		// CONTENT TABLES - Public read, Admin/Editor write
		// =========================================================================
		subjects: publicReadEditorWrite,
		chapters: publicReadEditorWrite,
		sections: publicReadEditorWrite,
		lessons: publicReadEditorWrite,
		lessonFiles: publicReadEditorWrite,
		tests: publicReadEditorWrite,
		questions: publicReadEditorWrite,
		questionOptions: publicReadEditorWrite,
		testQuestions: publicReadEditorWrite,
	};
}
