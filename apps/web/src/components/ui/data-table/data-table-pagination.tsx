import type { Table } from '@tanstack/react-table';
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react';
import {
	type ChangeEvent,
	type KeyboardEvent,
	useCallback,
	useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
	pageSizeOptions?: number[];
	pageSize: number;
	pageIndex: number;
	// For server-side pagination, we need to accept the total count externally
	totalRowCount?: number;
	// For cursor-based pagination, disable random access (first/last/jump) buttons
	disableRandomAccess?: boolean;
	// Hide the row count display for a more compact layout
	hideRowCount?: boolean;
}

export function DataTablePagination<TData>({
	table,
	pageSizeOptions = [10, 20, 50, 100],
	pageSize,
	pageIndex,
	totalRowCount,
	disableRandomAccess = false,
	hideRowCount = false,
}: DataTablePaginationProps<TData>) {
	// Use totalRowCount for server-side pagination, otherwise use filtered row count
	const rowCount = totalRowCount ?? table.getFilteredRowModel().rows.length;
	const pageCount = table.getPageCount();
	const currentPage = pageIndex + 1;

	// State for page input
	const [pageInputValue, setPageInputValue] = useState('');
	const [showPageInput, setShowPageInput] = useState(false);

	const handlePageInputChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.replace(/[^0-9]/g, '');
			setPageInputValue(value);
		},
		[]
	);

	const handlePageInputSubmit = useCallback(() => {
		const pageNum = Number.parseInt(pageInputValue, 10);
		if (pageNum >= 1 && pageNum <= pageCount) {
			table.setPageIndex(pageNum - 1);
		}
		setShowPageInput(false);
		setPageInputValue('');
	}, [pageInputValue, pageCount, table]);

	const handlePageInputKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				handlePageInputSubmit();
			} else if (e.key === 'Escape') {
				setShowPageInput(false);
				setPageInputValue('');
			}
		},
		[handlePageInputSubmit]
	);

	const handlePageDisplayClick = useCallback(() => {
		setShowPageInput(true);
		setPageInputValue(String(currentPage));
	}, [currentPage]);

	return (
		<div
			className={`flex items-center px-2 ${hideRowCount ? 'justify-end' : 'justify-between'}`}
		>
			{!hideRowCount && (
				<div className="text-muted-foreground text-sm">
					{rowCount} row(s) total
				</div>
			)}
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select
						onValueChange={(value) => table.setPageSize(Number(value))}
						value={`${pageSize}`}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={`${size}`}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[140px] items-center justify-center text-sm font-medium">
					{disableRandomAccess ? (
						<span>
							Page {currentPage} of {pageCount}
						</span>
					) : showPageInput ? (
						<div className="flex items-center gap-1">
							<span>Page</span>
							<Input
								autoFocus
								className="h-7 w-12 text-center"
								onBlur={handlePageInputSubmit}
								onChange={handlePageInputChange}
								onKeyDown={handlePageInputKeyDown}
								type="text"
								value={pageInputValue}
							/>
							<span>of {pageCount}</span>
						</div>
					) : (
						<button
							className="hover:underline cursor-pointer"
							onClick={handlePageDisplayClick}
							title="Click to jump to a specific page"
							type="button"
						>
							Page {currentPage} of {pageCount}
						</button>
					)}
				</div>
				<div className="flex items-center space-x-2">
					{/* First button always works - cursor for page 1 is always null */}
					<Button
						disabled={pageIndex === 0}
						onClick={() => table.setPageIndex(0)}
						size="icon"
						variant="outline"
					>
						<span className="sr-only">Go to first page</span>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button
						disabled={pageIndex === 0}
						onClick={() => table.previousPage()}
						size="icon"
						variant="outline"
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						disabled={pageIndex >= pageCount - 1}
						onClick={() => table.nextPage()}
						size="icon"
						variant="outline"
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRight className="h-4 w-4" />
					</Button>
					{!disableRandomAccess && (
						<Button
							disabled={pageIndex >= pageCount - 1}
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							size="icon"
							variant="outline"
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
