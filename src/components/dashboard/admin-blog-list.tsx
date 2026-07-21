"use client";

import { useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AdminBlogRow {
  id: string;
  title: string;
  status?: string;
  publishedAt?: string;
  categoryId?: string;
}

interface RawPost {
  _id: string;
  title: string;
  status?: string;
  publishedAt?: string;
  category?: string;
}

export function AdminBlogList({
  initialItems,
  categoryNames,
  pageSize,
}: {
  initialItems: AdminBlogRow[];
  categoryNames: Record<string, string>;
  pageSize: number;
}) {
  const fetchPage = useCallback(
    async (page: number, query: string): Promise<AdminBlogRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/blog?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: RawPost[] };
      return (data.items ?? []).map((d) => ({
        id: String(d._id),
        title: d.title,
        status: d.status,
        publishedAt: d.publishedAt,
        categoryId: d.category ? String(d.category) : undefined,
      }));
    },
    [pageSize],
  );

  const { items, sentinelRef, loading, done, query, setQuery } =
    useInfiniteList({ initialItems, pageSize, fetchPage });

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts by title…"
        className="max-w-xs"
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No posts yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => {
                const published = row.status === "published";
                return (
                  <TableRow key={row.id}>
                    <TableCell
                      className="max-w-xs truncate font-medium"
                      title={row.title}
                    >
                      {row.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(row.categoryId && categoryNames[row.categoryId]) ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={published ? "default" : "secondary"}>
                        {published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {row.publishedAt
                        ? format(new Date(row.publishedAt), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="bg-background sticky right-0">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/blog/${row.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </Link>
                        <DeleteButton
                          resource="blog"
                          id={row.id}
                          name={row.title}
                          label="Delete"
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

      {!done && <div ref={sentinelRef} aria-hidden className="h-6" />}
      {loading && (
        <p className="text-muted-foreground py-3 text-center text-sm">
          Loading…
        </p>
      )}
    </div>
  );
}
