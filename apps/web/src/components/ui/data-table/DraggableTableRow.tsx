import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender } from '@tanstack/react-table';
import { TableCell, TableRow } from '../table';

const DraggableRow = ({ row }: { row: any }) => {
	const { transform, transition, setNodeRef, isDragging, listeners } =
		useSortable({
			id: row.original._id,
		});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		// opacity: isDragging ? 0.4 : undefined,
	};

	// const style: CSSProperties = {
	// 	transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
	// 	transition,
	// 	opacity: isDragging ? 0.8 : 1,
	// 	zIndex: isDragging ? 1 : 0,
	// 	position: 'relative',
	// };
	return (
		// connect row ref to dnd-kit, apply important styles
		<TableRow ref={setNodeRef} style={style}>
			{isDragging ? (
				<TableCell colSpan={row.getAllCells().length}>&nbsp;</TableCell>
			) : (
				row.getVisibleCells().map((cell: any, index: number) => {
					if (index === 0) {
						return (
							<TableCell
								key={cell.id}
								style={{ width: cell.column.getSize() }}
								{...listeners}
							>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						);
					}

					return (
						<TableCell key={cell.id}>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</TableCell>
					);
				})
			)}
		</TableRow>
	);
};

export default DraggableRow;
