import { editorZodQuery } from './lib';

/**
 * Get dashboard statistics for admin view.
 * Returns counts for all curriculum content types.
 * Requires editor or admin role.
 */
export const getStats = editorZodQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;

		// Run all counts in parallel - single auth check, 6 parallel DB scans
		const [subjects, chapters, sections, lessons, tests, questions] =
			await Promise.all([
				db.query('subjects').collect(),
				db.query('chapters').collect(),
				db.query('sections').collect(),
				db.query('lessons').collect(),
				db.query('tests').collect(),
				db
					.query('questions')
					.withIndex('by_isActive', (q) => q.eq('isActive', true))
					.collect(),
			]);

		return {
			subjects: subjects.length,
			chapters: chapters.length,
			sections: sections.length,
			lessons: lessons.length,
			tests: tests.length,
			questions: questions.length,
		};
	},
});
