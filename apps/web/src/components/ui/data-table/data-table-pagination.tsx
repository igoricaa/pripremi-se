import { useState, useCallback, type KeyboardEvent, type ChangeEvent } from "react"
import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
  pageSize: number
  pageIndex: number
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100],
  pageSize,
  pageIndex,
}: DataTablePaginationProps<TData>) {
  const rowCount = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const currentPage = pageIndex + 1

  // State for page input
  const [pageInputValue, setPageInputValue] = useState("")
  const [showPageInput, setShowPageInput] = useState(false)

  const handlePageInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setPageInputValue(value)
  }, [])

  const handlePageInputSubmit = useCallback(() => {
    const pageNum = Number.parseInt(pageInputValue, 10)
    if (pageNum >= 1 && pageNum <= pageCount) {
      table.setPageIndex(pageNum - 1)
    }
    setShowPageInput(false)
    setPageInputValue("")
  }, [pageInputValue, pageCount, table])

  const handlePageInputKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageInputSubmit()
    } else if (e.key === "Escape") {
      setShowPageInput(false)
      setPageInputValue("")
    }
  }, [handlePageInputSubmit])

  const handlePageDisplayClick = useCallback(() => {
    setShowPageInput(true)
    setPageInputValue(String(currentPage))
  }, [currentPage])

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-muted-foreground text-sm">
        {rowCount} row(s) total
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
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
          {showPageInput ? (
            <div className="flex items-center gap-1">
              <span>Page</span>
              <Input
                type="text"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputKeyDown}
                onBlur={handlePageInputSubmit}
                className="h-7 w-12 text-center"
                autoFocus
              />
              <span>of {pageCount}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePageDisplayClick}
              className="hover:underline cursor-pointer"
              title="Click to jump to a specific page"
            >
              Page {currentPage} of {pageCount}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={pageIndex === 0}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={pageIndex >= pageCount - 1}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
