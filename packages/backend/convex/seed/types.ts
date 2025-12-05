import type { ContentType, QuestionDifficulty, QuestionType } from '@pripremi-se/shared';

/**
 * Seed data types for curriculum seeding.
 * These types define the structure of JSON seed files.
 */

/**
 * Question option for choice-based questions.
 */
export interface SeedQuestionOption {
	text: string;
	isCorrect: boolean;
	order: number;
}

/**
 * Question definition for seed data.
 * Questions can be linked to lessons for "Learn More" feature.
 */
export interface SeedQuestion {
	text: string;
	type: QuestionType;
	explanation: string;
	difficulty: QuestionDifficulty;
	points: number;
	allowPartialCredit?: boolean;
	lessonSlug?: string; // Links to lesson for "Learn More"
	options?: SeedQuestionOption[];
}

/**
 * Test definition for section assessments.
 */
export interface SeedTest {
	title: string;
	slug: string;
	description: string;
	timeLimit?: number; // Minutes
	passingScore: number; // Percentage (0-100)
	maxAttempts?: number;
	shuffleQuestions: boolean;
	showCorrectAnswers: boolean;
	questions: SeedQuestion[];
}

/**
 * Lesson definition within a section.
 */
export interface SeedLesson {
	title: string;
	slug: string;
	content: string; // Markdown content
	contentType: ContentType;
	estimatedMinutes: number;
}

/**
 * Section definition within a chapter.
 * Sections contain lessons and may have an assessment test.
 */
export interface SeedSection {
	name: string;
	slug: string;
	description?: string;
	lessons: SeedLesson[];
	test?: SeedTest;
}

/**
 * Chapter definition within a subject.
 */
export interface SeedChapter {
	name: string;
	slug: string;
	description: string;
	sections: SeedSection[];
}

/**
 * Root subject definition.
 * Contains the full curriculum hierarchy.
 */
export interface SeedSubject {
	name: string;
	slug: string;
	description: string;
	icon?: string;
	chapters: SeedChapter[];
}

/**
 * Result of seeding operation for tracking and validation.
 */
export interface SeedResult {
	subjectId: string;
	subjectName: string;
	chaptersCreated: number;
	sectionsCreated: number;
	lessonsCreated: number;
	testsCreated: number;
	questionsCreated: number;
	questionOptionsCreated: number;
}
