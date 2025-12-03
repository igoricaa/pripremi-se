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
export async function generateUniqueSlug<T extends 'subjects' | 'chapters' | 'sections' | 'lessons'>(
	db: DatabaseReader,
	tableName: T,
	baseSlug: string,
	excludeId?: Id<T>
): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const existing = await db
			.query(tableName as 'subjects' | 'chapters' | 'sections' | 'lessons')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first();

		if (!existing || (excludeId && existing._id === excludeId)) {
			return slug;
		}
		counter++;
		slug = `${baseSlug}-${counter}`;
	}
}

/**
 * Handle slug updates for entity update operations.
 * Returns the new unique slug if an update is needed, or undefined if no change.
 *
 * Logic:
 * 1. If explicit slug provided → use it (ensure uniqueness)
 * 2. If name changed (but no explicit slug) → regenerate from new name
 * 3. Otherwise → no slug update needed
 */
export async function handleSlugUpdate<T extends 'subjects' | 'chapters' | 'sections' | 'lessons'>(
	db: DatabaseReader,
	tableName: T,
	options: {
		slug?: string; // Explicit slug from user
		newName?: string; // New name if being updated
		existingName: string; // Current name of the entity
		excludeId: Id<T>; // Entity ID to exclude from uniqueness check
	}
): Promise<string | undefined> {
	const { slug, newName, existingName, excludeId } = options;

	// Case 1: Explicit slug provided
	if (slug !== undefined) {
		return await generateUniqueSlug(db, tableName, slug, excludeId);
	}

	// Case 2: Name changed without explicit slug → regenerate
	if (newName !== undefined && newName !== existingName) {
		const baseSlug = slugify(newName);
		return await generateUniqueSlug(db, tableName, baseSlug, excludeId);
	}

	// Case 3: No slug update needed
	return undefined;
}
