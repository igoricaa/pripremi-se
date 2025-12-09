import {
	closestCenter,
	DndContext,
	DragOverlay,
	DropAnimation,
	defaultDropAnimationSideEffects,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { useCallback, useEffect, useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import DraggableRow from './DraggableTableRow';
import { DataTablePagination } from './data-table-pagination';
import StaticTableRow from './StaticTableRow';

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	defaultPageSize?: number;
	pageSizeOptions?: number[];
	// Server-side pagination props
	manualPagination?: boolean;
	pageCount?: number;
	rowCount?: number;
	pageIndex?: number;
	pageSize?: number;
	onPaginationChange?: (pagination: PaginationState) => void;
	// For cursor-based pagination, disable random access (first/last/jump) buttons
	disableRandomAccess?: boolean;
	onReorder?: (items: Array<{ id: string; order: number }>) => Promise<void>;
	// Enable/disable drag-and-drop reordering (defaults to true)
	sortableEnabled?: boolean;
}

const dropAnimationConfig: DropAnimation = {
	sideEffects: defaultDropAnimationSideEffects({
		styles: {
			active: {
				// opacity: '0.4',
			},
		},
	}),
};

export function SortableDataTable<TData, TValue>({
	columns,
	data: initialData,
	defaultPageSize = 20,
	pageSizeOptions,
	// Server-side pagination props
	manualPagination = false,
	pageCount: externalPageCount,
	rowCount: externalRowCount,
	pageIndex: externalPageIndex,
	pageSize: externalPageSize,
	onPaginationChange,
	disableRandomAccess = false,
	onReorder,
	sortableEnabled = true,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [internalPagination, setInternalPagination] = useState<PaginationState>(
		{
			pageIndex: 0,
			pageSize: defaultPageSize,
		}
	);
	const [activeId, setActiveId] = useState(null);

	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {})
	);

	// Use external pagination state if in manual mode
	const pagination =
		manualPagination &&
		externalPageIndex !== undefined &&
		externalPageSize !== undefined
			? { pageIndex: externalPageIndex, pageSize: externalPageSize }
			: internalPagination;

	// Reset to first page when data changes (only for client-side pagination)
	useEffect(() => {
		if (!manualPagination) {
			setInternalPagination((prev) => ({ ...prev, pageIndex: 0 }));
		}
	}, [initialData.length, manualPagination]);

	const handlePaginationChange = useCallback(
		(
			updater: PaginationState | ((prev: PaginationState) => PaginationState)
		) => {
			const newPagination =
				typeof updater === 'function' ? updater(pagination) : updater;
			if (manualPagination && onPaginationChange) {
				onPaginationChange(newPagination);
			} else {
				setInternalPagination(newPagination);
			}
		},
		[manualPagination, onPaginationChange, pagination]
	);

	const table = useReactTable({
		data: initialData,
		columns,
		getRowId: (row: any) => row._id,
		getCoreRowModel: getCoreRowModel(),
		// Only use client-side pagination/filtering if not in manual mode
		...(manualPagination
			? {}
			: {
					getPaginationRowModel: getPaginationRowModel(),
					getFilteredRowModel: getFilteredRowModel(),
				}),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: handlePaginationChange,
		// Manual pagination settings
		manualPagination,
		pageCount: manualPagination ? externalPageCount : undefined,
		rowCount: manualPagination ? externalRowCount : undefined,
		state: {
			sorting,
			columnFilters,
			pagination,
		},
	});

	const items = initialData.map((row: any) => row._id);

	const selectedRow = () => {
		if (!activeId) return null;
		const row = table
			.getRowModel()
			.rows.find((row: any) => row.original._id === activeId);
		return row;
	};

	function handleDragStart(event: any) {
		setActiveId(event.active.id);
	}

	function handleDragEnd(event: any) {
		const { active, over } = event;
		setActiveId(null);

		if (!over || active.id === over.id) {
			return;
		}

		// const oldIndex = initialData.indexOf(active.id);
		const oldIndex = initialData.findIndex(
			(item: any) => item._id === active.id
		);
		// const newIndex = items.indexOf(over.id);
		const newIndex = initialData.findIndex((item: any) => item._id === over.id);

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		// Create reordered array to calculate new order values
		const newData = arrayMove([...initialData], oldIndex, newIndex);
		// const newData = arrayMove(data, oldIndex, newIndex);

		// Call onReorder with new order values
		if (onReorder) {
			const reorderItems = newData.map((item: any, index: number) => ({
				id: item._id,
				order: index,
			}));
			onReorder(reorderItems);
		}
	}

	function handleDragCancel() {
		setActiveId(null);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<DataTablePagination
					disableRandomAccess={manualPagination && disableRandomAccess}
					hideRowCount={true}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					pageSizeOptions={pageSizeOptions}
					table={table}
					totalRowCount={manualPagination ? externalRowCount : undefined}
				/>
			</div>
			<div className="rounded-md border">
				{sortableEnabled ? (
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragCancel={handleDragCancel}
						onDragEnd={handleDragEnd}
						onDragStart={handleDragStart}
						sensors={sensors}
					>
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext()
														)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								<SortableContext
									items={items}
									strategy={verticalListSortingStrategy}
								>
									{table.getRowModel().rows?.length ? (
										table
											.getRowModel()
											.rows.map((row: any) => (
												<DraggableRow key={row.original._id} row={row} />
											))
									) : (
										<TableRow>
											<TableCell
												className="h-24 text-center"
												colSpan={columns.length}
											>
												No results.
											</TableCell>
										</TableRow>
									)}
								</SortableContext>
							</TableBody>
						</Table>
						<DragOverlay dropAnimation={dropAnimationConfig}>
							{activeId && (
								<Table>
									<TableBody>
										<StaticTableRow row={selectedRow()} />
									</TableBody>
								</Table>
							)}
						</DragOverlay>
					</DndContext>
				) : (
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row: any) => (
									<TableRow key={row.original._id}>
										{row.getVisibleCells().map((cell: any) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										className="h-24 text-center"
										colSpan={columns.length}
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				)}
			</div>
			<DataTablePagination
				disableRandomAccess={manualPagination && disableRandomAccess}
				pageIndex={pagination.pageIndex}
				pageSize={pagination.pageSize}
				pageSizeOptions={pageSizeOptions}
				table={table}
				totalRowCount={manualPagination ? externalRowCount : undefined}
			/>
		</div>
	);
}
