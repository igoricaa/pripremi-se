import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@pripremi-se/backend/convex/_generated/api';
import { useQueryWithStatus } from '@/lib/convex';
import type { FileType } from '@pripremi-se/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
} from '@/components/ui/card';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import {
	FileImage,
	FileVideo,
	FileAudio,
	FileText,
	Trash2,
	Edit,
	ExternalLink,
	Upload,
	Copy,
	Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileUploader } from './FileUploader';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { DELETE_MESSAGES } from '@/lib/constants/admin-ui';

interface MediaLibraryProps {
	lessonId: string;
	className?: string;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getFileIcon(fileType: FileType) {
	switch (fileType) {
		case 'image':
			return <FileImage className="h-6 w-6" />;
		case 'video':
			return <FileVideo className="h-6 w-6" />;
		case 'audio':
			return <FileAudio className="h-6 w-6" />;
		case 'pdf':
			return <FileText className="h-6 w-6" />;
		default:
			return <FileText className="h-6 w-6" />;
	}
}

function getFileTypeBadgeVariant(fileType: FileType): 'default' | 'secondary' {
	switch (fileType) {
		case 'image':
			return 'default';
		case 'video':
			return 'secondary';
		case 'audio':
			return 'secondary';
		case 'pdf':
			return 'secondary';
		default:
			return 'secondary';
	}
}

export function MediaLibrary({ lessonId, className }: MediaLibraryProps) {
	const [showUploader, setShowUploader] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [editingFile, setEditingFile] = useState<{
		id: string;
		altText: string;
	} | null>(null);
	const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

	const { data: files, isPending } = useQueryWithStatus(
		api.lessonFiles.listLessonFilesByLesson,
		{ lessonId }
	);

	const updateLessonFile = useMutation(api.lessonFiles.updateLessonFile);
	const deleteLessonFile = useMutation(api.lessonFiles.deleteLessonFile).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(api.lessonFiles.listLessonFilesByLesson, { lessonId });

		if (current === undefined) return;

		const updated = current.filter((item) => item._id !== args.id);
		
		localStore.setQuery(api.lessonFiles.listLessonFilesByLesson, { lessonId }, updated);
		toast.success('File deleted successfully');
	});

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteLessonFile({ id: idToDelete });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete file'
			);
		}
	};

	const handleUpdateAltText = async () => {
		if (!editingFile) return;

		try {
			await updateLessonFile({
				id: editingFile.id,
				altText: editingFile.altText || null,
			});
			toast.success('Alt text updated');
			setEditingFile(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to update alt text'
			);
		}
	};

	const copyToClipboard = async (url: string, fileId: string) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopiedUrl(fileId);
			toast.success('URL copied to clipboard');
			setTimeout(() => setCopiedUrl(null), 2000);
		} catch {
			toast.error('Failed to copy URL');
		}
	};

	if (isPending) {
		return (
			<div className={cn('space-y-4', className)}>
				<div className="flex items-center justify-between">
					<h3 className="font-medium text-lg">Media Library</h3>
				</div>
				<div className="flex items-center justify-center py-8">
					<p className="text-muted-foreground">Loading files...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={cn('space-y-4', className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Media Library</h3>
					<p className="text-muted-foreground text-sm">
						{files?.length ?? 0} file{(files?.length ?? 0) !== 1 ? 's' : ''}
					</p>
				</div>
				<Button onClick={() => setShowUploader(true)}>
					<Upload className="mr-2 h-4 w-4" />
					Upload Files
				</Button>
			</div>

			{/* File grid */}
			{!files || files.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileImage className="mb-4 h-12 w-12 text-muted-foreground" />
						<p className="text-muted-foreground mb-4">No files uploaded yet</p>
						<Button onClick={() => setShowUploader(true)}>
							<Upload className="mr-2 h-4 w-4" />
							Upload Your First File
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{files.map((file) => (
						<Card key={file._id} className="overflow-hidden">
							{/* Preview */}
							<div className="relative aspect-video bg-muted">
								{file.fileType === 'image' && file.url ? (
									<img
										src={file.url}
										alt={file.altText || file.fileName}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full items-center justify-center text-muted-foreground">
										{getFileIcon(file.fileType as FileType)}
									</div>
								)}
								<Badge
									variant={getFileTypeBadgeVariant(file.fileType as FileType)}
									className="absolute right-2 top-2"
								>
									{file.fileType}
								</Badge>
							</div>

							{/* Info */}
							<CardContent className="p-4">
								<p className="mb-1 truncate font-medium text-sm" title={file.fileName}>
									{file.fileName}
								</p>
								<p className="text-muted-foreground text-xs">
									{formatBytes(file.fileSize)} - {formatDate(file.createdAt)}
								</p>
								{file.altText && (
									<p className="mt-1 truncate text-muted-foreground text-xs italic">
										Alt: {file.altText}
									</p>
								)}

								{/* Actions */}
								<div className="mt-4 flex items-center gap-2">
									{file.url && (
										<>
											<Button
												variant="outline"
												size="sm"
												onClick={() => copyToClipboard(file.url!, file._id)}
											>
												{copiedUrl === file._id ? (
													<Check className="h-4 w-4" />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</Button>
											<Button
												variant="outline"
												size="sm"
												asChild
											>
												<a
													href={file.url}
													target="_blank"
													rel="noopener noreferrer"
												>
													<ExternalLink className="h-4 w-4" />
												</a>
											</Button>
										</>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setEditingFile({
												id: file._id,
												altText: file.altText ?? '',
											})
										}
									>
										<Edit className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
										onClick={() => setDeleteId(file._id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Upload sheet */}
			<Sheet open={showUploader} onOpenChange={setShowUploader}>
				<SheetContent className="sm:max-w-lg">
					<SheetHeader>
						<SheetTitle>Upload Files</SheetTitle>
						<SheetDescription>
							Drag and drop files or click to browse. Supported formats: Images,
							Videos, Audio, PDF.
						</SheetDescription>
					</SheetHeader>
					<div className="mt-6">
						<FileUploader
							lessonId={lessonId}
							onCancel={() => setShowUploader(false)}
						/>
					</div>
				</SheetContent>
			</Sheet>

			{/* Edit alt text sheet */}
			<Sheet
				open={!!editingFile}
				onOpenChange={(open) => !open && setEditingFile(null)}
			>
				<SheetContent className="sm:max-w-md">
					<SheetHeader>
						<SheetTitle>Edit Alt Text</SheetTitle>
						<SheetDescription>
							Add descriptive alt text for accessibility and SEO.
						</SheetDescription>
					</SheetHeader>
					<div className="mt-6 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="altText">Alt Text</Label>
							<Input
								id="altText"
								placeholder="Describe this image..."
								value={editingFile?.altText ?? ''}
								onChange={(e) =>
									setEditingFile((prev) =>
										prev ? { ...prev, altText: e.target.value } : null
									)
								}
							/>
							<p className="text-muted-foreground text-xs">
								Alt text describes images for screen readers and displays when
								images fail to load.
							</p>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setEditingFile(null)}>
								Cancel
							</Button>
							<Button onClick={handleUpdateAltText}>Save</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			{/* Delete confirmation */}
			<DeleteConfirmDialog
				open={!!deleteId}
				onOpenChange={() => setDeleteId(null)}
				onConfirm={handleDelete}
				title={DELETE_MESSAGES.file.title}
				description={DELETE_MESSAGES.file.description}
			/>
		</div>
	);
}
