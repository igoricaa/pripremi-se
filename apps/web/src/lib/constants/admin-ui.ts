/**
 * Admin UI constants for consistent configuration across admin pages.
 */

/** Default page size for admin tables */
export const DEFAULT_PAGE_SIZE = 20;

/** Available page size options for admin tables */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/** Maximum files allowed for upload */
export const MAX_FILE_UPLOAD_COUNT = 10;

/** Minimum search term length to trigger search */
export const MIN_SEARCH_LENGTH = 2;

/** Debounce delay for search inputs (ms) */
export const SEARCH_DEBOUNCE_MS = 300;

/** Delete confirmation messages by entity type */
export const DELETE_MESSAGES = {
	chapter: {
		title: 'Delete Chapter',
		description:
			'Are you sure you want to delete this chapter? This action cannot be undone. All sections and lessons under this chapter must be deleted first.',
	},
	section: {
		title: 'Delete Section',
		description:
			'Are you sure you want to delete this section? This action cannot be undone. All lessons under this section must be deleted first.',
	},
	lesson: {
		title: 'Delete Lesson',
		description:
			'Are you sure you want to delete this lesson? This action cannot be undone.',
	},
	subject: {
		title: 'Delete Subject',
		description:
			'Are you sure you want to delete this subject? This action cannot be undone. All chapters under this subject must be deleted first.',
	},
	question: {
		title: 'Delete Question',
		description:
			'Are you sure you want to delete this question? This action cannot be undone. This will also remove the question from any tests it belongs to.',
	},
	file: {
		title: 'Delete File',
		description:
			'Are you sure you want to delete this file? This action cannot be undone. Any references to this file in the lesson content will be broken.',
	},
	test: {
		title: 'Delete Test',
		description:
			'Are you sure you want to delete this test? This action cannot be undone.',
	},
} as const;

export type DeleteEntityType = keyof typeof DELETE_MESSAGES;
