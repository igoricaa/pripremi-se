import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import {
	MIME_TYPE_MAP,
	FILE_SIZE_LIMITS,
	getFileTypeFromMime,
} from '@pripremi-se/shared';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileImage, FileVideo, FileAudio, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
	lessonId: string;
	onUploadComplete?: (fileId: string) => void;
	onCancel?: () => void;
	accept?: string;
	maxFiles?: number;
	className?: string;
}

interface UploadingFile {
	file: File;
	progress: number;
	status: 'pending' | 'uploading' | 'success' | 'error';
	error?: string;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
	const type = getFileTypeFromMime(mimeType);
	switch (type) {
		case 'image':
			return <FileImage className="h-8 w-8" />;
		case 'video':
			return <FileVideo className="h-8 w-8" />;
		case 'audio':
			return <FileAudio className="h-8 w-8" />;
		case 'pdf':
			return <FileText className="h-8 w-8" />;
		default:
			return <FileText className="h-8 w-8" />;
	}
}

export function FileUploader({
	lessonId,
	onUploadComplete,
	onCancel,
	accept,
	maxFiles = 10,
	className,
}: FileUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.lessonFiles.generateUploadUrl);
	const createLessonFile = useMutation(api.lessonFiles.createLessonFile);

	function validateFile(file: File): string | null {
		const fileType = getFileTypeFromMime(file.type);

		if (!fileType) {
			return `Unsupported file type: ${file.type}`;
		}

		const sizeLimit = FILE_SIZE_LIMITS[fileType];
		if (file.size > sizeLimit) {
			return `File too large. Maximum size for ${fileType}: ${formatBytes(sizeLimit)}`;
		}

		return null;
	}

	async function uploadFile(file: File, index: number) {
		// Update status to uploading
		setUploadingFiles((prev) =>
			prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f))
		);

		try {
			// Get upload URL from Convex
			const uploadUrl = await generateUploadUrl();

			// Create XMLHttpRequest for progress tracking
			const xhr = new XMLHttpRequest();

			const uploadPromise = new Promise<string>((resolve, reject) => {
				xhr.upload.addEventListener('progress', (event) => {
					if (event.lengthComputable) {
						const progress = Math.round((event.loaded / event.total) * 100);
						setUploadingFiles((prev) =>
							prev.map((f, i) => (i === index ? { ...f, progress } : f))
						);
					}
				});

				xhr.addEventListener('load', () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						const response = JSON.parse(xhr.responseText);
						resolve(response.storageId);
					} else {
						reject(new Error(`Upload failed: ${xhr.statusText}`));
					}
				});

				xhr.addEventListener('error', () => {
					reject(new Error('Upload failed'));
				});
			});

			xhr.open('POST', uploadUrl);
			xhr.send(file);

			const storageId = await uploadPromise;

			// Get file type
			const fileType = getFileTypeFromMime(file.type);
			if (!fileType) {
				throw new Error('Invalid file type');
			}

			// Create file record in database
			const fileId = await createLessonFile({
				lessonId,
				storageId,
				fileName: file.name,
				fileType,
				mimeType: file.type,
				fileSize: file.size,
			});

			// Update status to success
			setUploadingFiles((prev) =>
				prev.map((f, i) =>
					i === index ? { ...f, status: 'success', progress: 100 } : f
				)
			);

			onUploadComplete?.(fileId);
			toast.success(`Uploaded: ${file.name}`);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Upload failed';
			setUploadingFiles((prev) =>
				prev.map((f, i) =>
					i === index ? { ...f, status: 'error', error: errorMessage } : f
				)
			);
			toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
		}
	}

	function handleFiles(files: FileList | null) {
		if (!files) return;

		const fileArray = Array.from(files);
		const remainingSlots = maxFiles - uploadingFiles.length;

		if (fileArray.length > remainingSlots) {
			toast.error(`Maximum ${maxFiles} files allowed`);
			return;
		}

		// Validate and add files
		const newFiles: UploadingFile[] = [];
		for (const file of fileArray) {
			const error = validateFile(file);
			if (error) {
				toast.error(`${file.name}: ${error}`);
				continue;
			}
			newFiles.push({ file, progress: 0, status: 'pending' });
		}

		if (newFiles.length === 0) return;

		setUploadingFiles((prev) => [...prev, ...newFiles]);

		// Start uploading
		const startIndex = uploadingFiles.length;
		for (let i = 0; i < newFiles.length; i++) {
			const newFile = newFiles[i];
			if (newFile) {
				uploadFile(newFile.file, startIndex + i);
			}
		}
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
		handleFiles(e.dataTransfer.files);
	}

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(true);
	}

	function handleDragLeave(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
	}

	function removeFile(index: number) {
		setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
	}

	const acceptedTypes = accept || Object.keys(MIME_TYPE_MAP).join(',');

	return (
		<div className={cn('space-y-4', className)}>
			{/* Drop zone */}
			<div
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => inputRef.current?.click()}
				className={cn(
					'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
					isDragging
						? 'border-primary bg-primary/5'
						: 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
				)}
			>
				<input
					ref={inputRef}
					type="file"
					multiple
					accept={acceptedTypes}
					onChange={(e) => handleFiles(e.target.files)}
					className="hidden"
				/>
				<Upload
					className={cn(
						'mb-4 h-12 w-12',
						isDragging ? 'text-primary' : 'text-muted-foreground'
					)}
				/>
				<p className="mb-1 text-sm font-medium">
					{isDragging ? 'Drop files here' : 'Drag and drop files here'}
				</p>
				<p className="text-muted-foreground text-xs">
					or click to browse (Images, Videos, Audio, PDF)
				</p>
			</div>

			{/* File list */}
			{uploadingFiles.length > 0 && (
				<div className="space-y-2">
					{uploadingFiles.map((uploadingFile, index) => (
						<div
							key={`${uploadingFile.file.name}-${index}`}
							className="flex items-center gap-4 rounded-lg border p-3"
						>
							<div className="text-muted-foreground">
								{getFileIcon(uploadingFile.file.type)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="truncate text-sm font-medium">
									{uploadingFile.file.name}
								</p>
								<p className="text-muted-foreground text-xs">
									{formatBytes(uploadingFile.file.size)}
								</p>
								{uploadingFile.status === 'uploading' && (
									<Progress value={uploadingFile.progress} className="mt-2 h-1" />
								)}
								{uploadingFile.status === 'error' && (
									<p className="text-destructive text-xs mt-1">
										{uploadingFile.error}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2">
								{uploadingFile.status === 'uploading' && (
									<span className="text-muted-foreground text-xs">
										{uploadingFile.progress}%
									</span>
								)}
								{uploadingFile.status === 'success' && (
									<span className="text-green-600 text-xs">Uploaded</span>
								)}
								{uploadingFile.status !== 'uploading' && (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={(e) => {
											e.stopPropagation();
											removeFile(index);
										}}
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Actions */}
			{onCancel && (
				<div className="flex justify-end">
					<Button variant="outline" onClick={onCancel}>
						Done
					</Button>
				</div>
			)}
		</div>
	);
}
