import type { DatabaseReader } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

// Serbian character transliteration map
const SERBIAN_MAP: Record<string, string> = {
	č: 'c',
	Č: 'c',
	ć: 'c',
	Ć: 'c',
	š: 's',
	Š: 's',
	ž: 'z',
	Ž: 'z',
	đ: 'dj',
	Đ: 'dj',
};

/**
 * Convert text to URL-friendly slug with Serbian character support.
 * Examples:
 *   "Srpski jezik" -> "srpski-jezik"
 *   "Matematička logika" -> "matematicka-logika"
 *   "Đački život" -> "djacki-zivot"
 */
export function slugify(text: string): string {
	return text
		.split('')
		.map((char) => SERBIAN_MAP[char] || char)
		.join('')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
		.replace(/\s+/g, '-') // Spaces to hyphens
		.replace(/-+/g, '-') // Collapse multiple hyphens
		.replace(/^-|-$/g, ''); // Trim hyphens from ends
}

/**
 * Generate a unique slug for the subjects table by appending -2, -3, etc. if it already exists.
 */
export async function generateUniqueSlug(
	db: DatabaseReader,
	tableName: 'subjects',
	baseSlug: string,
	excludeId?: Id<'subjects'>
): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const existing = await db
			.query(tableName)
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first();

		if (!existing || (excludeId && existing._id === excludeId)) {
			return slug;
		}
		counter++;
		slug = `${baseSlug}-${counter}`;
	}
}
