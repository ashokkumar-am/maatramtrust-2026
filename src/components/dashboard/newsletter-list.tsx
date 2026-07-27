"use client";

import { useCallback } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { NewsletterDialog } from "@/components/dashboard/newsletter-dialog";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface SubscriberRow {
  id: string;
  email: string;
  isSource?: string;
  createdAt?: string;
}

interface RawSubscriber {
  _id: string;
  email: string;
  isSource?: string;
  createdAt?: string;
}

export function NewsletterList({
  initialItems,
  pageSize,
}: {
  initialItems: SubscriberRow[];
  pageSize: number;
}) {
  const fetchPage = useCallback(
    async (page: number, query: string): Promise<SubscriberRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/newsletter?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: RawSubscriber[] };
      return (data.items ?? []).map((d) => ({
        id: String(d._id),
        email: d.email,
        isSource: d.isSource,
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
        placeholder="Search by email…"
        className="max-w-xs"
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No subscribers yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.isSource ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {row.createdAt
                      ? format(new Date(row.createdAt), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="bg-background sticky right-0">
                    <div className="flex items-center justify-end gap-2">
                      <NewsletterDialog subscriber={row} />
                      <DeleteButton
                        resource="newsletter"
                        id={row.id}
                        name={row.email}
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
      <div ref={sentinelRef} aria-hidden className="h-6" />
      {loading && (
        <p className="text-muted-foreground py-3 text-center text-sm">
          Loading…
        </p>
      )}
    </div>
  );
}
