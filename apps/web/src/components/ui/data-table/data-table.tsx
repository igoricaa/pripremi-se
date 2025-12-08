import { useState, useEffect, useCallback } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  defaultPageSize?: number
  pageSizeOptions?: number[]
  // Server-side pagination props
  manualPagination?: boolean
  pageCount?: number
  rowCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (pagination: PaginationState) => void
  // For cursor-based pagination, disable random access (first/last/jump) buttons
  disableRandomAccess?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  // Use external pagination state if in manual mode
  const pagination = manualPagination && externalPageIndex !== undefined && externalPageSize !== undefined
    ? { pageIndex: externalPageIndex, pageSize: externalPageSize }
    : internalPagination

  // Reset to first page when data changes (only for client-side pagination)
  useEffect(() => {
    if (!manualPagination) {
      setInternalPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }, [data.length, manualPagination])

  const handlePaginationChange = useCallback((updater: PaginationState | ((prev: PaginationState) => PaginationState)) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater
    if (manualPagination && onPaginationChange) {
      onPaginationChange(newPagination)
    } else {
      setInternalPagination(newPagination)
    }
  }, [manualPagination, onPaginationChange, pagination])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Only use client-side pagination/filtering if not in manual mode
    ...(manualPagination ? {} : {
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
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          pageSize={pagination.pageSize}
          pageIndex={pagination.pageIndex}
          totalRowCount={manualPagination ? externalRowCount : undefined}
          disableRandomAccess={manualPagination && disableRandomAccess}
          hideRowCount={true}
        />
      </div>
      <div className="rounded-md border">
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
        pageSize={pagination.pageSize}
        pageIndex={pagination.pageIndex}
        totalRowCount={manualPagination ? externalRowCount : undefined}
        disableRandomAccess={manualPagination && disableRandomAccess}
      />
    </div>
  )
}
