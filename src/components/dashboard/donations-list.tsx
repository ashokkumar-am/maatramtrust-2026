"use client";

import { useCallback } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VoidDonationButton } from "@/components/dashboard/void-donation-button";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DonationRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  source: string;
  donorName?: string;
  email?: string;
  category?: string;
  at: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> =
  {
    captured: "default",
    created: "secondary",
    failed: "destructive",
    refunded: "destructive",
  };

export function DonationsList({
  initialItems,
  pageSize,
}: {
  initialItems: DonationRow[];
  pageSize: number;
}) {
  const fetchPage = useCallback(
    async (page: number, query: string): Promise<DonationRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/donations?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { donations?: DonationRow[] };
      return data.donations ?? [];
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
        placeholder="Search by donor, email, or note…"
        className="max-w-xs"
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No donations yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.donorName || (d.email ?? "Anonymous")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{d.amount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={d.source === "cash" ? "secondary" : "default"}
                    >
                      {d.source === "cash" ? "Cash" : "Web"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[d.status] ?? "secondary"}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(d.at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="bg-background sticky right-0 text-right">
                    {d.status === "captured" ? (
                      <VoidDonationButton id={d.id} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
