import type { ColumnDef } from "@tanstack/react-table"
import type { Doc } from "@pripremi-se/backend/convex/_generated/dataModel"
import { Link } from "@tanstack/react-router"
import { GripVertical, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"

type Subject = Doc<"subjects">

interface GetColumnsOptions {
  onDelete: (id: string) => void
}

export function getSubjectColumns({
  onDelete,
}: GetColumnsOptions): ColumnDef<Subject>[] {
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
        const subject = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link
                to="/admin/subjects/$subjectId"
                params={{ subjectId: subject._id }}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(subject._id)}
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
