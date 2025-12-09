import {
	createQuestionSchema,
	updateQuestionSchema,
	getQuestionByIdSchema,
	deleteQuestionSchema,
	createQuestionOptionSchema,
	updateQuestionOptionSchema,
	deleteQuestionOptionSchema,
	createQuestionWithOptionsSchema,
	QUESTION_TYPES,
} from '@pripremi-se/shared';
import { v } from 'convex/values';
import type { Id, Doc } from './_generated/dataModel';
import { query } from './_generated/server';
import { editorZodMutation, editorZodQuery, editorQuery, createTimestamps, updateTimestamp } from './lib';
import schema from './schema';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

type DatabaseReader = {
	get: <T extends keyof typeof schema.tables>(id: Id<T>) => Promise<Doc<T> | null>;
};

/**
 * Get hierarchy IDs (sectionId, chapterId, subjectId) from a lessonId.
 * Used to denormalize hierarchy data when creating/updating questions.
 */
async function getHierarchyFromLesson(
	db: DatabaseReader,
	lessonId: Id<'lessons'>
): Promise<{
	sectionId: Id<'sections'>;
	chapterId: Id<'chapters'>;
	subjectId: Id<'subjects'>;
} | null> {
	const lesson = await db.get(lessonId);
	if (!lesson) return null;

	const section = await db.get(lesson.sectionId);
	if (!section) return null;

	const chapter = await db.get(section.chapterId);
	if (!chapter) return null;

	return {
		sectionId: lesson.sectionId,
		chapterId: section.chapterId,
		subjectId: chapter.subjectId,
	};
}

/**
 * Validate that question options match the question type requirements.
 */
function validateQuestionOptions(
	type: string,
	options: Array<{ text: string; isCorrect: boolean; order: number }>
): void {
	const correctCount = options.filter((o) => o.isCorrect).length;

	if (type === QUESTION_TYPES.SINGLE_CHOICE || type === QUESTION_TYPES.TRUE_FALSE) {
		if (options.length === 0) {
			throw new Error('Single choice and true/false questions must have options');
		}
		if (correctCount !== 1) {
			throw new Error('Single choice and true/false questions must have exactly one correct answer');
		}
		if (type === QUESTION_TYPES.TRUE_FALSE && options.length !== 2) {
			throw new Error('True/false questions must have exactly 2 options');
		}
	} else if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
		if (options.length === 0) {
			throw new Error('Multiple choice questions must have options');
		}
		if (correctCount < 1) {
			throw new Error('Multiple choice questions must have at least one correct answer');
		}
	} else if (type === QUESTION_TYPES.SHORT_ANSWER || type === QUESTION_TYPES.ESSAY) {
		if (options.length > 0) {
			throw new Error('Text-based questions (short answer/essay) should not have options');
		}
	}
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single question with its options.
 * Public query - no authentication required.
 */
export const getQuestionWithOptions = query({
	args: { questionId: v.id('questions') },
	handler: async (ctx, args) => {
		const question = await ctx.db.get(args.questionId);
		if (!question) return null;

		const options = await ctx.db
			.query('questionOptions')
			.withIndex('by_questionId_order', (q) => q.eq('questionId', args.questionId))
			.collect();

		return { ...question, options };
	},
});

/**
 * Get a single question by ID (admin view).
 * Requires editor or admin role.
 */
export const getQuestionById = editorZodQuery({
	args: getQuestionByIdSchema,
	handler: async (ctx, args) => {
		const question = await ctx.db.get(args.id as Id<'questions'>);
		return question;
	},
});

/**
 * List options for a specific question.
 * Public query - no authentication required.
 */
export const listQuestionOptions = query({
	args: { questionId: v.id('questions') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('questionOptions')
			.withIndex('by_questionId_order', (q) => q.eq('questionId', args.questionId))
			.collect();
	},
});

/**
 * Get hierarchy data for filter dropdowns (cached separately).
 * This rarely changes, so frontend can cache for 30+ minutes.
 * Requires editor or admin role.
 */
export const getQuestionFilterOptions = editorQuery({
	args: {},
	handler: async (ctx) => {
		const { db } = ctx;

		const [subjects, chapters, sections, lessons] = await Promise.all([
			db.query('subjects').withIndex('by_order').collect(),
			db.query('chapters').withIndex('by_subjectId_order').collect(),
			db.query('sections').withIndex('by_chapterId_order').collect(),
			db.query('lessons').withIndex('by_sectionId_order').collect(),
		]);

		return { subjects, chapters, sections, lessons };
	},
});

/**
 * Paginated questions query for admin panel with server-side filtering and search.
 * Supports two modes:
 * - SEARCH MODE: Uses full-text search index (results ordered by relevance)
 * - BROWSE MODE: Uses regular indexes (results ordered by creation time)
 * Requires editor or admin role.
 */
export const listQuestionsPaginated = editorQuery({
	args: {
		cursor: v.optional(v.string()),
		pageSize: v.optional(v.number()),
		// Search term (min 2 chars for search to trigger)
		searchTerm: v.optional(v.string()),
		// Filters
		type: v.optional(v.string()),
		difficulty: v.optional(v.string()),
		subjectId: v.optional(v.id('subjects')),
		chapterId: v.optional(v.id('chapters')),
		sectionId: v.optional(v.id('sections')),
		lessonId: v.optional(v.id('lessons')),
	},
	handler: async (ctx, args) => {
		const { db } = ctx;
		const pageSize = args.pageSize ?? 20;

		// Minimum 2 characters for search to trigger
		const effectiveSearch = (args.searchTerm?.trim().length ?? 0) >= 2
			? args.searchTerm?.trim()
			: null;

		let paginationResult;

		if (effectiveSearch) {
			// SEARCH MODE: Use search index (relevance-ordered)
			const searchQuery = db.query('questions')
				.withSearchIndex('search_text', (q) => {
					let sq = q.search('text', effectiveSearch);
					// Apply filters via search index filterFields
					if (args.type) sq = sq.eq('type', args.type);
					if (args.difficulty) sq = sq.eq('difficulty', args.difficulty);
					if (args.subjectId) sq = sq.eq('subjectId', args.subjectId);
					if (args.chapterId) sq = sq.eq('chapterId', args.chapterId);
					if (args.sectionId) sq = sq.eq('sectionId', args.sectionId);
					if (args.lessonId) sq = sq.eq('lessonId', args.lessonId);
					return sq;
				});

			// Note: Search results are relevance-ordered automatically (BM25)
			paginationResult = await searchQuery.paginate({
				cursor: args.cursor ?? null,
				numItems: pageSize,
			});
		} else {
			// BROWSE MODE: Use regular indexes (creation-time ordered)
			// Build query with exact filter matching using .withIndex().eq()
			// Priority: most selective index first (lessonId > sectionId > chapterId > subjectId > type > difficulty)
			let usedIndexForDifficulty = false;
			let baseQuery;

			if (args.lessonId && args.type) {
				baseQuery = db.query('questions')
					.withIndex('by_lessonId_type', (q) => q.eq('lessonId', args.lessonId!).eq('type', args.type!));
			} else if (args.lessonId) {
				baseQuery = db.query('questions')
					.withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId!));
			} else if (args.sectionId && args.type) {
				baseQuery = db.query('questions')
					.withIndex('by_sectionId_type', (q) => q.eq('sectionId', args.sectionId!).eq('type', args.type!));
			} else if (args.sectionId) {
				baseQuery = db.query('questions')
					.withIndex('by_sectionId', (q) => q.eq('sectionId', args.sectionId!));
			} else if (args.chapterId && args.type) {
				baseQuery = db.query('questions')
					.withIndex('by_chapterId_type', (q) => q.eq('chapterId', args.chapterId!).eq('type', args.type!));
			} else if (args.chapterId) {
				baseQuery = db.query('questions')
					.withIndex('by_chapterId', (q) => q.eq('chapterId', args.chapterId!));
			} else if (args.subjectId && args.type) {
				baseQuery = db.query('questions')
					.withIndex('by_subjectId_type', (q) => q.eq('subjectId', args.subjectId!).eq('type', args.type!));
			} else if (args.subjectId) {
				baseQuery = db.query('questions')
					.withIndex('by_subjectId', (q) => q.eq('subjectId', args.subjectId!));
			} else if (args.type && args.difficulty) {
				baseQuery = db.query('questions')
					.withIndex('by_type_difficulty', (q) => q.eq('type', args.type!).eq('difficulty', args.difficulty!));
				usedIndexForDifficulty = true;
			} else if (args.type) {
				baseQuery = db.query('questions')
					.withIndex('by_type', (q) => q.eq('type', args.type!));
			} else if (args.difficulty) {
				baseQuery = db.query('questions')
					.withIndex('by_difficulty', (q) => q.eq('difficulty', args.difficulty!));
				usedIndexForDifficulty = true;
			} else {
				// No filters - use default ordering
				baseQuery = db.query('questions');
			}

			// Use Convex's native pagination with cursor
			paginationResult = await baseQuery
				.order('desc')
				.paginate({
					cursor: args.cursor ?? null,
					numItems: pageSize,
				});

			// Post-filter for difficulty if we used a non-difficulty index
			if (args.difficulty && !usedIndexForDifficulty) {
				paginationResult = {
					...paginationResult,
					page: paginationResult.page.filter((q) => q.difficulty === args.difficulty),
				};
			}
		}

		// Fetch lessons for display names
		const lessonIds = [...new Set(paginationResult.page.map((q) => q.lessonId).filter(Boolean))] as Id<'lessons'>[];
		const lessons = await Promise.all(lessonIds.map((id) => db.get(id)));
		const lessonMap = new Map(lessons.filter(Boolean).map((l) => [l!._id, l!]));

		// Return truncated questions for table display
		const questions = paginationResult.page.map((q) => {
			const lesson = q.lessonId ? lessonMap.get(q.lessonId) : null;
			return {
				_id: q._id,
				text: q.text.length > 100 ? `${q.text.substring(0, 100)}...` : q.text,
				type: q.type,
				difficulty: q.difficulty,
				points: q.points,
				lessonId: q.lessonId,
				sectionId: q.sectionId,
				chapterId: q.chapterId,
				subjectId: q.subjectId,
				lessonTitle: lesson?.title ?? null,
			};
		});

		// Return in same format for frontend compatibility
		return {
			questions,
			nextCursor: paginationResult.isDone ? null : paginationResult.continueCursor,
			hasMore: !paginationResult.isDone,
		};
	},
});

/**
 * Get total count of questions matching filters and/or search.
 * Used for pagination UI to show "Page X of Y".
 * Requires editor or admin role.
 */
export const countQuestionsForAdmin = editorQuery({
	args: {
		searchTerm: v.optional(v.string()),
		type: v.optional(v.string()),
		difficulty: v.optional(v.string()),
		subjectId: v.optional(v.id('subjects')),
		chapterId: v.optional(v.id('chapters')),
		sectionId: v.optional(v.id('sections')),
		lessonId: v.optional(v.id('lessons')),
	},
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Minimum 2 characters for search to trigger
		const effectiveSearch = (args.searchTerm?.trim().length ?? 0) >= 2
			? args.searchTerm?.trim()
			: null;

		if (effectiveSearch) {
			// Count via search - need to collect and count
			// Search index can scan up to 1024 results
			const results = await db.query('questions')
				.withSearchIndex('search_text', (q) => {
					let sq = q.search('text', effectiveSearch);
					if (args.type) sq = sq.eq('type', args.type);
					if (args.difficulty) sq = sq.eq('difficulty', args.difficulty);
					if (args.subjectId) sq = sq.eq('subjectId', args.subjectId);
					if (args.chapterId) sq = sq.eq('chapterId', args.chapterId);
					if (args.sectionId) sq = sq.eq('sectionId', args.sectionId);
					if (args.lessonId) sq = sq.eq('lessonId', args.lessonId);
					return sq;
				})
				.collect();

			return { count: results.length };
		}

		// Use indexes for efficient counting - same strategy as listQuestionsPaginated
		let usedIndexForDifficulty = false;
		let baseQuery;

		if (args.lessonId && args.type) {
			baseQuery = db.query('questions')
				.withIndex('by_lessonId_type', (q) => q.eq('lessonId', args.lessonId!).eq('type', args.type!));
		} else if (args.lessonId) {
			baseQuery = db.query('questions')
				.withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId!));
		} else if (args.sectionId && args.type) {
			baseQuery = db.query('questions')
				.withIndex('by_sectionId_type', (q) => q.eq('sectionId', args.sectionId!).eq('type', args.type!));
		} else if (args.sectionId) {
			baseQuery = db.query('questions')
				.withIndex('by_sectionId', (q) => q.eq('sectionId', args.sectionId!));
		} else if (args.chapterId && args.type) {
			baseQuery = db.query('questions')
				.withIndex('by_chapterId_type', (q) => q.eq('chapterId', args.chapterId!).eq('type', args.type!));
		} else if (args.chapterId) {
			baseQuery = db.query('questions')
				.withIndex('by_chapterId', (q) => q.eq('chapterId', args.chapterId!));
		} else if (args.subjectId && args.type) {
			baseQuery = db.query('questions')
				.withIndex('by_subjectId_type', (q) => q.eq('subjectId', args.subjectId!).eq('type', args.type!));
		} else if (args.subjectId) {
			baseQuery = db.query('questions')
				.withIndex('by_subjectId', (q) => q.eq('subjectId', args.subjectId!));
		} else if (args.type && args.difficulty) {
			baseQuery = db.query('questions')
				.withIndex('by_type_difficulty', (q) => q.eq('type', args.type!).eq('difficulty', args.difficulty!));
			usedIndexForDifficulty = true;
		} else if (args.type) {
			baseQuery = db.query('questions')
				.withIndex('by_type', (q) => q.eq('type', args.type!));
		} else if (args.difficulty) {
			baseQuery = db.query('questions')
				.withIndex('by_difficulty', (q) => q.eq('difficulty', args.difficulty!));
			usedIndexForDifficulty = true;
		} else {
			// No filters - count all
			baseQuery = db.query('questions');
		}

		let questions = await baseQuery.collect();

		// Post-filter for difficulty if we used a non-difficulty index
		if (args.difficulty && !usedIndexForDifficulty) {
			questions = questions.filter((q) => q.difficulty === args.difficulty);
		}

		return { count: questions.length };
	},
});

// ============================================================================
// MUTATIONS - QUESTIONS
// ============================================================================

export const createQuestion = editorZodMutation({
	args: createQuestionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;

		// Get hierarchy data if lessonId is provided
		let hierarchyData: {
			sectionId?: Id<'sections'>;
			chapterId?: Id<'chapters'>;
			subjectId?: Id<'subjects'>;
		} = {};

		if (args.lessonId) {
			const hierarchy = await getHierarchyFromLesson(db, args.lessonId as Id<'lessons'>);
			if (hierarchy) {
				hierarchyData = hierarchy;
			}
		}

		const questionId = await db.insert('questions', {
			...args,
			lessonId: args.lessonId ? (args.lessonId as Id<'lessons'>) : undefined,
			...hierarchyData,
			...createTimestamps(),
		});
		return questionId;
	},
});

/**
 * Create a question with its options in a single transaction.
 * This is the preferred way to create questions.
 * Requires editor or admin role.
 */
export const createQuestionWithOptions = editorZodMutation({
	args: createQuestionWithOptionsSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { question, options } = args;

		// Validate question type vs options
		validateQuestionOptions(question.type, options);

		// Get hierarchy data if lessonId is provided
		let hierarchyData: {
			sectionId?: Id<'sections'>;
			chapterId?: Id<'chapters'>;
			subjectId?: Id<'subjects'>;
		} = {};

		if (question.lessonId) {
			const hierarchy = await getHierarchyFromLesson(db, question.lessonId as Id<'lessons'>);
			if (hierarchy) {
				hierarchyData = hierarchy;
			}
		}

		// Create question with hierarchy data
		const questionId = await db.insert('questions', {
			...question,
			lessonId: question.lessonId ? (question.lessonId as Id<'lessons'>) : undefined,
			...hierarchyData,
			...createTimestamps(),
		});

		// Create options
		await Promise.all(
			options.map((option) =>
				db.insert('questionOptions', {
					questionId,
					...option,
					createdAt: Date.now(),
				})
			)
		);

		return questionId;
	},
});

/**
 * Update an existing question.
 * Requires editor or admin role.
 */
export const updateQuestion = editorZodMutation({
	args: updateQuestionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, ...updates } = args;
		const questionId = id as Id<'questions'>;

		const existing = await db.get(questionId);
		if (!existing) {
			throw new Error('Question not found');
		}

		const updateData: Record<string, unknown> = {
			...updateTimestamp(),
		};

		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				updateData[key] = value === null ? undefined : value;
			}
		}

		// Update hierarchy data if lessonId is being changed
		if ('lessonId' in updates) {
			if (updates.lessonId === null || updates.lessonId === undefined) {
				// Clear hierarchy when lessonId is removed
				updateData.sectionId = undefined;
				updateData.chapterId = undefined;
				updateData.subjectId = undefined;
			} else {
				// Update hierarchy when lessonId changes
				const hierarchy = await getHierarchyFromLesson(db, updates.lessonId as Id<'lessons'>);
				if (hierarchy) {
					updateData.sectionId = hierarchy.sectionId;
					updateData.chapterId = hierarchy.chapterId;
					updateData.subjectId = hierarchy.subjectId;
				}
			}
		}

		await db.patch(questionId, updateData);

		return questionId;
	},
});

/**
 * Delete a question and all its options.
 * WARNING: This is a hard delete. Consider implications for linked tests and user answers.
 * Requires editor or admin role.
 */
export const deleteQuestion = editorZodMutation({
	args: deleteQuestionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const questionId = args.id as Id<'questions'>;

		const existing = await db.get(questionId);
		if (!existing) {
			throw new Error('Question not found');
		}

		// Delete all test-question links and options (cascade)
		const [testQuestionLinks, options] = await Promise.all([
			db
				.query('testQuestions')
				.withIndex('by_questionId', (q) => q.eq('questionId', questionId))
				.collect(),
			db
				.query('questionOptions')
				.withIndex('by_questionId', (q) => q.eq('questionId', questionId))
				.collect()
		]);

		await Promise.all([
			...testQuestionLinks.map((link) => db.delete(link._id)),
			...options.map((opt) => db.delete(opt._id))
		]);

		// Delete question
		await db.delete(questionId);

		return { success: true };
	},
});

// ============================================================================
// MUTATIONS - QUESTION OPTIONS
// ============================================================================

/**
 * Create a new option for an existing question.
 * Requires editor or admin role.
 */
export const createQuestionOption = editorZodMutation({
	args: createQuestionOptionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { questionId, ...data } = args;

		const optionId = await db.insert('questionOptions', {
			questionId: questionId as Id<'questions'>,
			...data,
			createdAt: Date.now(),
		});

		return optionId;
	},
});

/**
 * Update an existing question option.
 * Requires editor or admin role.
 */
export const updateQuestionOption = editorZodMutation({
	args: updateQuestionOptionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const { id, ...updates } = args;
		const optionId = id as Id<'questionOptions'>;

		const existing = await db.get(optionId);
		if (!existing) {
			throw new Error('Question option not found');
		}

		const updateData: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				updateData[key] = value;
			}
		}

		await db.patch(optionId, updateData);

		return optionId;
	},
});

/**
 * Delete a question option.
 * Requires editor or admin role.
 */
export const deleteQuestionOption = editorZodMutation({
	args: deleteQuestionOptionSchema,
	handler: async (ctx, args) => {
		const { db } = ctx;
		const optionId = args.id as Id<'questionOptions'>;

		const existing = await db.get(optionId);
		if (!existing) {
			throw new Error('Question option not found');
		}

		await db.delete(optionId);

		return { success: true };
	},
});
