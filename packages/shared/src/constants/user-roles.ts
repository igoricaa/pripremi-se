import { z } from 'zod';

/**
 * User role constants
 * Defines all user roles in the system
 */
export const USER_ROLES = {
	USER: 'user',
	EDITOR: 'editor',
	ADMIN: 'admin',
} as const;

/**
 * Union type of all user roles
 */
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Array of all user role values (for Zod enum)
 */
export const USER_ROLE_VALUES = Object.values(USER_ROLES);

/**
 * Zod enum schema for user roles
 */
export const userRoleEnum = z.enum([USER_ROLES.USER, USER_ROLES.EDITOR, USER_ROLES.ADMIN]);
