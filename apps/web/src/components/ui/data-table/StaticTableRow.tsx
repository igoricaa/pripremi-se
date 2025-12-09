import { flexRender } from '@tanstack/react-table';
import { Grip } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';

const StaticTableRow = ({ row }: { row: any }) => {
	return (
		<TableRow className="border-2">
			{row.getVisibleCells().map((cell: any, index: number) => {
				if (index === 0) {
					return (
						<TableCell className="flex gap-2 items-center" key={cell.id}>
							<Grip className="w-4 h-4" />
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</TableCell>
					);
				}
				return (
					<TableCell key={cell.id}>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				);
			})}
		</TableRow>
	);
};

export default StaticTableRow;
