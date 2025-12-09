/**
 * Run Seed Script
 *
 * This script loads the seed data and runs the Convex seed mutation.
 *
 * Usage:
 *   pnpm run seed:run
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(
	__dirname,
	'..',
	'convex',
	'seed',
	'data',
	'matematika'
);

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

function loadJsonFile<T>(filePath: string): T {
	const content = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(content) as T;
}

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

function loadSeedData(): SubjectFile {
	const subjectPath = path.join(DATA_DIR, 'subject.json');
	const subject = loadJsonFile<SubjectFile>(subjectPath);

	const chapterFiles = getChapterFiles();
	const chapters: ChapterFile[] = [];

	for (const filename of chapterFiles) {
		const chapterPath = path.join(DATA_DIR, filename);
		const chapter = loadJsonFile<ChapterFile>(chapterPath);
		chapters.push(chapter);
		console.log(
			`Loaded: ${filename} (${chapter.sections?.length || 0} sections)`
		);
	}

	console.log(`\nTotal chapters loaded: ${chapters.length}`);

	return {
		...subject,
		chapters,
	};
}

// Load environment variables
function getConvexUrl(): string {
	// Check for CONVEX_URL in .env.local
	const envLocalPath = path.join(__dirname, '..', '.env.local');
	if (fs.existsSync(envLocalPath)) {
		const envContent = fs.readFileSync(envLocalPath, 'utf-8');
		const match = envContent.match(/CONVEX_URL=(.+)/);
		if (match) {
			return match[1].trim();
		}
	}

	// Check environment variable
	if (process.env.CONVEX_URL) {
		return process.env.CONVEX_URL;
	}

	throw new Error(
		'CONVEX_URL not found. Please set it in .env.local or as environment variable.'
	);
}

async function main() {
	console.log('Loading seed data...\n');
	const data = loadSeedData();

	const convexUrl = getConvexUrl();
	console.log(`\nConnecting to Convex: ${convexUrl}\n`);

	const client = new ConvexHttpClient(convexUrl);

	console.log('Running seed mutation...\n');

	try {
		const result = await client.action(api.seed.index.runSeed, { data });
		console.log('\n=== Seed Complete ===');
		console.log(JSON.stringify(result, null, 2));
	} catch (error) {
		console.error('Seed failed:', error);
		throw error;
	}
}

main().catch((error) => {
	console.error('Error running seed:', error);
	process.exit(1);
});
