import type { FileType } from '@pripremi-se/shared';
import { getFileTypeFromMime } from '@pripremi-se/shared';
import { FileAudio, FileImage, FileText, FileVideo } from 'lucide-react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

/**
 * Format bytes to human-readable string.
 * @example formatBytes(1024) => "1 KB"
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format timestamp to localized date string.
 */
export function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * Get appropriate icon component for a file type.
 * @param fileType - The file type (image, video, audio, pdf)
 * @param className - Optional className for the icon
 */
export function getFileIconByType(
	fileType: FileType,
	className = 'h-6 w-6'
): ReactNode {
	const iconProps = { className };
	switch (fileType) {
		case 'image':
			return createElement(FileImage, iconProps);
		case 'video':
			return createElement(FileVideo, iconProps);
		case 'audio':
			return createElement(FileAudio, iconProps);
		case 'pdf':
			return createElement(FileText, iconProps);
		default:
			return createElement(FileText, iconProps);
	}
}

/**
 * Get appropriate icon component for a MIME type.
 * @param mimeType - The MIME type string
 * @param className - Optional className for the icon
 */
export function getFileIconByMime(
	mimeType: string,
	className = 'h-8 w-8'
): ReactNode {
	const fileType = getFileTypeFromMime(mimeType);
	const iconProps = { className };
	switch (fileType) {
		case 'image':
			return createElement(FileImage, iconProps);
		case 'video':
			return createElement(FileVideo, iconProps);
		case 'audio':
			return createElement(FileAudio, iconProps);
		case 'pdf':
			return createElement(FileText, iconProps);
		default:
			return createElement(FileText, iconProps);
	}
}
