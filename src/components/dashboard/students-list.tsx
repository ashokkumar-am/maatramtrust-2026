"use client";

import { useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { HandHeart, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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

export interface StudentRow {
  id: string;
  student_id: string;
  name: string;
  student_type: string;
  amount: number;
  isDonate?: boolean;
  createdAt?: string;
}

interface RawStudent {
  _id: string;
  student_id: string;
  name: string;
  student_type: string;
  amount: number;
  isDonate?: boolean;
  createdAt?: string;
}

export function StudentsList({
  initialItems,
  pageSize,
}: {
  initialItems: StudentRow[];
  pageSize: number;
}) {
  const fetchPage = useCallback(
    async (page: number, query: string): Promise<StudentRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: RawStudent[] };
      return (data.items ?? []).map((d) => ({
        id: String(d._id),
        student_id: d.student_id,
        name: d.name,
        student_type: d.student_type,
        amount: d.amount,
        isDonate: d.isDonate,
        createdAt: d.createdAt,
      }));
    },
    [pageSize],
  );

  const { items, sentinelRef, loading, query, setQuery } = useInfiniteList({
    initialItems,
    pageSize,
    fetchPage,
  });

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or student ID…"
        className="max-w-xs"
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Donate</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No students yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    {row.student_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/students/${row.id}`}
                      className="hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.student_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{(row.amount ?? 0).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>{row.isDonate ? "Yes" : "—"}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {row.createdAt
                      ? format(new Date(row.createdAt), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="bg-background sticky right-0">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/students/${row.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        <HandHeart className="size-3" />
                        Donors
                      </Link>
                      <Link
                        href={`/dashboard/students/${row.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        <Pencil className="size-3" />
                        Edit
                      </Link>
                      <DeleteButton
                        resource="students"
                        id={row.id}
                        name={row.name}
                        label="Delete"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {<div ref={sentinelRef} aria-hidden className="h-6" />}
      {loading && (
        <p className="text-muted-foreground py-3 text-center text-sm">
          Loading…
        </p>
      )}
    </div>
  );
}
