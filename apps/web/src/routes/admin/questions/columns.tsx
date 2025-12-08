import type { ColumnDef } from '@tanstack/react-table';
import { Link } from '@tanstack/react-router';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table';
import { QUESTION_DIFFICULTY, questionTypeLabels, difficultyLabels } from '@pripremi-se/shared';

const difficultyColors: Record<
	string,
	'default' | 'secondary' | 'destructive'
> = {
	[QUESTION_DIFFICULTY.EASY]: 'secondary',
	[QUESTION_DIFFICULTY.MEDIUM]: 'default',
	[QUESTION_DIFFICULTY.HARD]: 'destructive',
};

// Type matching the truncated question from listQuestionsPaginated
interface QuestionForTable {
	_id: string;
	text: string;
	type: string;
	difficulty: string | undefined;
	points: number;
	lessonId: string | undefined;
	sectionId: string | undefined;
	chapterId: string | undefined;
	subjectId: string | undefined;
	lessonTitle: string | null;
}

interface GetColumnsOptions {
	onDelete: (id: string) => void;
}

export function getQuestionColumns({
	onDelete,
}: GetColumnsOptions): ColumnDef<QuestionForTable>[] {
	return [
		{
			accessorKey: 'text',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Question" />
			),
			cell: ({ row }) => (
				<div className="flex max-w-md items-start gap-2">
					<span className="line-clamp-2">{row.getValue('text')}</span>
				</div>
			),
		},
		{
			accessorKey: 'type',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Type" />
			),
			cell: ({ row }) => (
				<Badge variant="outline">
					{questionTypeLabels[row.getValue('type') as string]}
				</Badge>
			),
		},
		{
			accessorKey: 'difficulty',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Difficulty" />
			),
			cell: ({ row }) => {
				const difficulty = row.getValue('difficulty') as string | undefined;
				if (!difficulty) {
					return <span className="text-muted-foreground">-</span>;
				}
				return (
					<Badge variant={difficultyColors[difficulty]}>
						{difficultyLabels[difficulty]}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'points',
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Points" />
			),
		},
		{
			accessorKey: 'lessonTitle',
			header: 'Lesson',
			cell: ({ row }) => {
				const lessonTitle = row.original.lessonTitle;
				if (!lessonTitle) {
					return <span className="text-muted-foreground">-</span>;
				}
				return (
					<span className="text-muted-foreground text-sm">
						{lessonTitle}
					</span>
				);
			},
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				const question = row.original;
				return (
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" asChild>
							<Link
								to="/admin/questions/$questionId"
								params={{ questionId: question._id }}
							>
								<Pencil className="h-4 w-4" />
								<span className="sr-only">Edit</span>
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onDelete(question._id)}
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
