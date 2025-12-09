import type { Doc, Id } from '@pripremi-se/backend/convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table';

type Section = Doc<'sections'> & {
	chapterName?: string | null;
};

interface Chapter {
	_id: Id<'chapters'>;
	name: string;
}

interface GetColumnsOptions {
	chapterMap: Map<Id<'chapters'>, Chapter>;
	onDelete: (id: string) => void;
	sortableEnabled?: boolean;
}

export function getSectionColumns({
	chapterMap,
	onDelete,
	sortableEnabled = true,
}: GetColumnsOptions): ColumnDef<Section>[] {
	return [
		// Only include drag column when sortable is enabled
		...(sortableEnabled
			? [
					{
						id: 'drag',
						header: '',
						cell: () => (
							<GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
						),
						enableSorting: false,
					} as ColumnDef<Section>,
				]
			: []),
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => (
				<span className="font-medium">{row.getValue('name')}</span>
			),
		},
		{
			accessorKey: 'chapterId',
			header: 'Chapter',
			cell: ({ row }) => {
				const section = row.original;
				const chapter = chapterMap.get(section.chapterId);
				return (
					<span className="text-muted-foreground">
						{chapter?.name ?? section.chapterName ?? 'Unknown'}
					</span>
				);
			},
		},
		{
			accessorKey: 'slug',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Slug" />
			),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-sm">
					{row.getValue('slug')}
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
				const section = row.original;
				return (
					<div className="flex items-center gap-2">
						<Button asChild size="icon" variant="ghost">
							<Link
								params={{ sectionId: section._id }}
								to="/admin/sections/$sectionId"
							>
								<Pencil className="h-4 w-4" />
								<span className="sr-only">Edit</span>
							</Link>
						</Button>
						<Button
							onClick={() => onDelete(section._id)}
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
