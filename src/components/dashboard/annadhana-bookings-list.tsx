"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { toLocalDay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AnnadhanaCancelButton } from "@/components/dashboard/annadhana-cancel-button";
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

export interface BookingRow {
  id: string;
  occasion: string;
  occasionDetail?: string;
  honoreeName?: string;
  eventDate: string;
  donorName?: string;
  donorEmail?: string;
  amount: number;
  receivedAmt: number;
  currency: string;
  status: string;
  source: string;
  campaignTitle?: string;
}

/** Raw admin API booking document (subset used by the table). */
interface BookingDoc extends Omit<BookingRow, "id"> {
  _id: string;
}

function toBookingRow(doc: BookingDoc): BookingRow {
  return { ...doc, id: String(doc._id) };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> =
  {
    received: "default",
    pending: "secondary",
    failed: "destructive",
    cancelled: "destructive",
  };

const OCCASION_LABEL: Record<string, string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  memorial: "Memorial",
  other: "Other",
};

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

export function AnnadhanaBookingsList({
  initialItems,
  pageSize,
}: {
  initialItems: BookingRow[];
  pageSize: number;
}) {
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState("");
  const [when, setWhen] = useState("");

  const fetchPage = useCallback(
    async (page: number, query: string): Promise<BookingRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      if (occasion) params.set("occasion", occasion);
      if (status) params.set("status", status);
      if (when) params.set("when", when);
      const res = await fetch(
        `/api/admin/annadhana/bookings?${params.toString()}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: BookingDoc[] };
      return (data.items ?? []).map(toBookingRow);
    },
    [pageSize, occasion, status, when],
  );

  const { items, sentinelRef, loading, query, setQuery } = useInfiniteList({
    initialItems,
    pageSize,
    fetchPage,
    refreshKey: `${occasion}|${status}|${when}`,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by donor or honoree…"
          className="max-w-xs"
        />
        <select
          className={selectClass}
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          aria-label="Filter by time"
        >
          <option value="">All dates</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        <select
          className={selectClass}
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          aria-label="Filter by occasion"
        >
          <option value="">All occasions</option>
          <option value="birthday">Birthday</option>
          <option value="anniversary">Anniversary</option>
          <option value="memorial">Memorial</option>
          <option value="other">Other</option>
        </select>
        <select
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event date</TableHead>
              <TableHead>Occasion</TableHead>
              <TableHead>For</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  No bookings yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(toLocalDay(b.eventDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {b.occasionDetail ||
                      (OCCASION_LABEL[b.occasion] ?? b.occasion)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.honoreeName ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {b.donorName || (b.donorEmail ?? "Anonymous")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹
                    {(b.status === "received"
                      ? b.receivedAmt
                      : b.amount
                    ).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[b.status] ?? "secondary"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.campaignTitle ?? "—"}
                  </TableCell>
                  <TableCell className="bg-background sticky right-0">
                    <div className="flex items-center justify-end gap-1">
                      {(b.status === "pending" || b.status === "received") && (
                        <AnnadhanaCancelButton id={b.id} />
                      )}
                      {b.status !== "received" && (
                        <DeleteButton
                          resource="annadhana/bookings"
                          id={b.id}
                          name={b.donorName}
                        />
                      )}
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
