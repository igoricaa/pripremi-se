import type { Doc, Id } from '@pripremi-se/backend/convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import {
	FileText,
	GripVertical,
	Layers,
	Pencil,
	Trash2,
	Video,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table';

type Lesson = Doc<'lessons'> & {
	sectionName?: string | null;
	chapterName?: string | null;
	subjectName?: string | null;
};

interface Section {
	_id: Id<'sections'>;
	name: string;
	chapterId: Id<'chapters'>;
}

interface Chapter {
	_id: Id<'chapters'>;
	name: string;
}

function getContentTypeIcon(contentType: string) {
	switch (contentType) {
		case 'video':
			return <Video className="h-4 w-4" />;
		case 'interactive':
			return <Layers className="h-4 w-4" />;
		default:
			return <FileText className="h-4 w-4" />;
	}
}

interface GetColumnsOptions {
	sectionMap: Map<Id<'sections'>, Section>;
	chapterMap: Map<Id<'chapters'>, Chapter>;
	onDelete: (id: string) => void;
}

export function getLessonColumns({
	sectionMap,
	chapterMap,
	onDelete,
}: GetColumnsOptions): ColumnDef<Lesson>[] {
	return [
		{
			id: 'drag',
			header: '',
			cell: () => (
				<GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
			),
			enableSorting: false,
		},
		{
			accessorKey: 'title',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Title" />
			),
			cell: ({ row }) => (
				<span className="font-medium">{row.getValue('title')}</span>
			),
		},
		{
			accessorKey: 'sectionId',
			header: 'Section',
			cell: ({ row }) => {
				const lesson = row.original;
				const section = sectionMap.get(lesson.sectionId);
				const chapter = section ? chapterMap.get(section.chapterId) : null;
				return (
					<div className="flex flex-col text-muted-foreground">
						<span className="text-xs">
							{chapter?.name ?? lesson.chapterName ?? 'Unknown'}
						</span>
						<span>{section?.name ?? lesson.sectionName ?? 'Unknown'}</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'contentType',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Type" />
			),
			cell: ({ row }) => {
				const contentType = row.getValue('contentType') as string;
				return (
					<div className="flex items-center gap-1.5 text-muted-foreground">
						{getContentTypeIcon(contentType)}
						<span className="capitalize">{contentType}</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'estimatedMinutes',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Duration" />
			),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.getValue('estimatedMinutes')} min
				</span>
			),
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			cell: ({ row }) => {
				const isActive = row.getValue('isActive') as boolean;
				return (
					<Badge variant={isActive ? 'default' : 'secondary'}>
						{isActive ? 'Active' : 'Draft'}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'order',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Order" />
			),
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				const lesson = row.original;
				return (
					<div className="flex items-center gap-2">
						<Button asChild size="icon" variant="ghost">
							<Link
								params={{ lessonId: lesson._id }}
								to="/admin/lessons/$lessonId"
							>
								<Pencil className="h-4 w-4" />
								<span className="sr-only">Edit</span>
							</Link>
						</Button>
						<Button
							onClick={() => onDelete(lesson._id)}
							size="icon"
							variant="ghost"
						>
							<Trash2 className="h-4 w-4" />
							<span className="sr-only">Delete</span>
						</Button>
					</div>
				);
			},
		},
	];
}
