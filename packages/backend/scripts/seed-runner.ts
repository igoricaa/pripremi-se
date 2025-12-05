/**
 * Seed Runner Script
 *
 * This script loads all JSON seed data files and combines them into a
 * complete subject structure ready for the seedCurriculum mutation.
 *
 * Usage:
 *   npx ts-node convex/seed/runner.ts > seed-data.json
 *   # Then use the output with: npx convex run seed:seedCurriculum --args '{"data": <paste-content>}'
 *
 * Or import and use programmatically:
 *   import { loadSeedData } from './runner';
 *   const data = loadSeedData();
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'convex', 'seed', 'data', 'matematika');

interface ChapterFile {
	name: string;
	slug: string;
	description: string;
	sections: unknown[];
}

interface SubjectFile {
	name: string;
	slug: string;
	description: string;
	icon?: string;
	chapters: unknown[];
}

/**
 * Load and parse a JSON file.
 */
function loadJsonFile<T>(filePath: string): T {
	const content = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(content) as T;
}

/**
 * Get all chapter files sorted by their numeric prefix.
 */
function getChapterFiles(): string[] {
	const files = fs.readdirSync(DATA_DIR);
	return files
		.filter((f) => f.match(/^\d{2}-.*\.json$/) && f !== 'subject.json')
		.sort((a, b) => {
			const numA = Number.parseInt(a.split('-')[0], 10);
			const numB = Number.parseInt(b.split('-')[0], 10);
			return numA - numB;
		});
}

/**
 * Load all seed data and combine into a complete subject structure.
 */
export function loadSeedData(): SubjectFile {
	// Load subject metadata
	const subjectPath = path.join(DATA_DIR, 'subject.json');
	const subject = loadJsonFile<SubjectFile>(subjectPath);

	// Load and combine chapters
	const chapterFiles = getChapterFiles();
	const chapters: ChapterFile[] = [];

	for (const filename of chapterFiles) {
		const chapterPath = path.join(DATA_DIR, filename);
		const chapter = loadJsonFile<ChapterFile>(chapterPath);
		chapters.push(chapter);
		console.error(`Loaded: ${filename} (${chapter.sections?.length || 0} sections)`);
	}

	console.error(`\nTotal chapters loaded: ${chapters.length}`);

	// Combine subject with chapters
	return {
		...subject,
		chapters,
	};
}

/**
 * Print statistics about the loaded data.
 */
export function printStats(data: SubjectFile): void {
	let totalSections = 0;
	let totalLessons = 0;
	let totalTests = 0;
	let totalQuestions = 0;

	for (const chapter of data.chapters as ChapterFile[]) {
		const sections = chapter.sections as Array<{
			lessons?: unknown[];
			test?: { questions?: unknown[] };
		}>;
		totalSections += sections.length;

		for (const section of sections) {
			totalLessons += section.lessons?.length || 0;
			if (section.test) {
				totalTests++;
				totalQuestions += section.test.questions?.length || 0;
			}
		}
	}

	console.error('\n=== Seed Data Statistics ===');
	console.error(`Subject: ${data.name}`);
	console.error(`Chapters: ${data.chapters.length}`);
	console.error(`Sections: ${totalSections}`);
	console.error(`Lessons: ${totalLessons}`);
	console.error(`Tests: ${totalTests}`);
	console.error(`Questions: ${totalQuestions}`);
	console.error('============================\n');
}

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
	try {
		const data = loadSeedData();
		printStats(data);

		// Output JSON to stdout (can be redirected to a file)
		console.log(JSON.stringify(data, null, 2));
	} catch (error) {
		console.error('Error loading seed data:', error);
		process.exit(1);
	}
}
