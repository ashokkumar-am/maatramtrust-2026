import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LIMIT = 100;

interface Row {
  _id: unknown;
  name: string;
  slug: string;
  type?: string;
  parent?: unknown; // ObjectId ref to another category
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export const metadata = { title: "Categories · Maatram Admin" };

export default async function AdminCategoriesPage() {
  await requireAdminPage("/dashboard/categories");
  await connectMongoDB();

  const rows = await Category.find()
    .sort({ order: 1, name: 1 })
    .limit(LIMIT)
    .select("name slug type parent icon order isActive")
    .lean<Row[]>()
    .exec();

  // Resolve parent names in-memory (parents are top-level categories in the
  // same set) — avoids a populate that depends on the cached model schema.
  const nameById = new Map(rows.map((r) => [String(r._id), r.name]));
  const parentName = (row: Row) =>
    row.parent ? (nameById.get(String(row.parent)) ?? "—") : "—";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length} categories.
          </p>
        </div>
        <Link
          href="/dashboard/categories/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Plus className="size-3" />
          New category
        </Link>
      </header>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const id = String(row._id);
                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {row.icon ? (
                          <Image
                            src={row.icon}
                            alt=""
                            width={24}
                            height={24}
                            unoptimized
                            className="size-6 rounded object-cover"
                          />
                        ) : null}
                        {row.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {parentName(row)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.type ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.order ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "default" : "secondary"}>
                        {row.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="bg-background sticky right-0">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/categories/${id}/edit`}
                          className={cn(
                            buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                            }),
                          )}
                          aria-label="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <DeleteButton
                          resource="categories"
                          id={id}
                          name={row.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
