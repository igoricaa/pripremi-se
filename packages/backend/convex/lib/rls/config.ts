import type { RLSConfig } from 'convex-helpers/server/rowLevelSecurity';

export const rlsConfig: RLSConfig = {
	defaultPolicy: 'deny', // Tables without rules are BLOCKED
};
