"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, toLocalDay } from "@/lib/utils";
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

export interface UpdateRow {
  id: string;
  campaignTitle?: string;
  date: string;
  title?: string;
  mediaCount: number;
  isActive?: boolean;
}

export interface UpdateCampaignFilter {
  id: string;
  title: string;
}

/** Raw admin API update document (subset used by the table). */
interface UpdateDoc {
  _id: string;
  campaignTitle?: string;
  date: string;
  title?: string;
  media?: unknown[];
  isActive?: boolean;
}

function toUpdateRow(doc: UpdateDoc): UpdateRow {
  return {
    id: String(doc._id),
    campaignTitle: doc.campaignTitle,
    date: doc.date,
    title: doc.title,
    mediaCount: doc.media?.length ?? 0,
    isActive: doc.isActive,
  };
}

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

export function AnnadhanaUpdatesList({
  initialItems,
  campaigns,
  pageSize,
}: {
  initialItems: UpdateRow[];
  campaigns: UpdateCampaignFilter[];
  pageSize: number;
}) {
  const [campaign, setCampaign] = useState("");

  const fetchPage = useCallback(
    async (page: number): Promise<UpdateRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (campaign) params.set("campaign", campaign);
      const res = await fetch(
        `/api/admin/annadhana/updates?${params.toString()}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: UpdateDoc[] };
      return (data.items ?? []).map(toUpdateRow);
    },
    [pageSize, campaign],
  );

  const { items, sentinelRef, loading } = useInfiniteList({
    initialItems,
    pageSize,
    fetchPage,
    refreshKey: campaign,
  });

  return (
    <div className="flex flex-col gap-2">
      <select
        className={cn(selectClass, "w-fit")}
        value={campaign}
        onChange={(e) => setCampaign(e.target.value)}
        aria-label="Filter by campaign"
      >
        <option value="">All campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Media</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No updates posted yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(toLocalDay(row.date), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.campaignTitle ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={row.title}>
                    {row.title ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.mediaCount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? "default" : "secondary"}>
                      {row.isActive ? "Live" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="bg-background sticky right-0">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/annadhana/updates/${row.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        )}
                        aria-label="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <DeleteButton
                        resource="annadhana/updates"
                        id={row.id}
                        name={row.title ?? row.campaignTitle}
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
