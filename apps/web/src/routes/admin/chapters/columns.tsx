import type { ColumnDef } from "@tanstack/react-table"
import type { Doc, Id } from "@pripremi-se/backend/convex/_generated/dataModel"
import { Link } from "@tanstack/react-router"
import { GripVertical, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"

type Chapter = Doc<"chapters"> & {
  subjectName?: string | null
}

interface GetColumnsOptions {
  subjectMap: Map<Id<"subjects">, string>
  onDelete: (id: string) => void
}

export function getChapterColumns({
  subjectMap,
  onDelete,
}: GetColumnsOptions): ColumnDef<Chapter>[] {
  return [
    {
      id: "drag",
      header: "",
      cell: () => (
        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "subjectId",
      header: "Subject",
      cell: ({ row }) => {
        const chapter = row.original
        return (
          <span className="text-muted-foreground">
            {subjectMap.get(chapter.subjectId) ?? chapter.subjectName ?? "Unknown"}
          </span>
        )
      },
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Slug" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-sm">
          {row.getValue("slug")}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Draft"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const chapter = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link
                to="/admin/chapters/$chapterId"
                params={{ chapterId: chapter._id }}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(chapter._id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]
}
