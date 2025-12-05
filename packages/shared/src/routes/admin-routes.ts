/**
 * Admin route definitions
 * Used by both web and mobile apps for navigation
 */

export interface AdminRoute {
	title: string;
	href: string;
	icon: string; // Icon name as string for cross-platform (e.g., 'BookOpen')
}

/**
 * Routes visible to ALL curriculum managers (editors + admins)
 * Content management routes
 */
export const BASE_ADMIN_ROUTES: AdminRoute[] = [
	{ title: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
	{ title: 'Subjects', href: '/admin/subjects', icon: 'BookOpen' },
	{ title: 'Chapters', href: '/admin/chapters', icon: 'FolderTree' },
	{ title: 'Sections', href: '/admin/sections', icon: 'Layers' },
	{ title: 'Lessons', href: '/admin/lessons', icon: 'FileText' },
	{ title: 'Tests', href: '/admin/tests', icon: 'ListChecks' },
	{ title: 'Questions', href: '/admin/questions', icon: 'HelpCircle' },
];

/**
 * Routes visible ONLY to admins
 * User management and system settings
 */
export const ADMIN_ONLY_ROUTES: AdminRoute[] = [
	{ title: 'Users', href: '/admin/users', icon: 'Users' },
];

/**
 * Get admin routes based on user's admin status
 * @param isAdmin - Whether the user has admin role
 * @returns Array of admin routes the user can access
 */
export function getAdminRoutes(isAdmin: boolean): AdminRoute[] {
	return isAdmin
		? [...BASE_ADMIN_ROUTES, ...ADMIN_ONLY_ROUTES]
		: BASE_ADMIN_ROUTES;
}
