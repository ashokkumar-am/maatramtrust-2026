"use client";

import { useCallback } from "react";
import { format } from "date-fns";
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

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  mobile: string;
  comments: string;
  createdAt?: string;
}

interface RawContact {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  comments: string;
  createdAt?: string;
}

export function ContactsList({
  initialItems,
  pageSize,
}: {
  initialItems: ContactRow[];
  pageSize: number;
}) {
  const fetchPage = useCallback(
    async (page: number, query: string): Promise<ContactRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/contacts?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: RawContact[] };
      return (data.items ?? []).map((d) => ({
        id: String(d._id),
        name: d.name,
        email: d.email,
        mobile: d.mobile,
        comments: d.comments,
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
        placeholder="Search by name, email, or mobile…"
        className="max-w-xs"
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No contact submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${row.email}`}
                      className="text-primary hover:underline"
                    >
                      {row.email}
                    </a>
                  </TableCell>
                  <TableCell className="tabular-nums">{row.mobile}</TableCell>
                  <TableCell className="max-w-xs truncate" title={row.comments}>
                    {row.comments}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {row.createdAt
                      ? format(new Date(row.createdAt), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="bg-background sticky right-0 text-right">
                    <DeleteButton
                      resource="contacts"
                      id={row.id}
                      name={row.name}
                      label="Delete"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div ref={sentinelRef} aria-hidden className="h-6" />
      {loading && (
        <p className="text-muted-foreground py-3 text-center text-sm">
          Loading…
        </p>
      )}
    </div>
  );
}
