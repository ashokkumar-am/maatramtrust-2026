import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { format } from "date-fns";
import connectMongoDB from "@/lib/mongoose";
import AnnadhanaCampaign from "@/models/AnnadhanaCampaignModel";
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
  title: string;
  slug: string;
  image?: string;
  minAmount?: number;
  targetAmount?: number;
  startDate?: Date;
  endDate?: Date;
  order?: number;
  isActive?: boolean;
}

export const metadata = { title: "Annadhana campaigns · Maatram Admin" };

function windowLabel(row: Row): string {
  if (!row.startDate && !row.endDate) return "Always open";
  const from = row.startDate ? format(row.startDate, "dd MMM yyyy") : "…";
  const to = row.endDate ? format(row.endDate, "dd MMM yyyy") : "…";
  return `${from} – ${to}`;
}

export default async function AdminAnnadhanaCampaignsPage() {
  await requireAdminPage("/dashboard/annadhana/campaigns");
  await connectMongoDB();

  const rows = await AnnadhanaCampaign.find()
    .sort({ order: 1, title: 1 })
    .limit(LIMIT)
    .select(
      "title slug image minAmount targetAmount startDate endDate order isActive",
    )
    .lean<Row[]>()
    .exec();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Annadhana campaigns
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length} campaigns. Active campaigns accept public bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/annadhana"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="size-3" />
            Bookings
          </Link>
          <Link
            href="/dashboard/annadhana/campaigns/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="size-3" />
            New campaign
          </Link>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Min (₹)</TableHead>
              <TableHead className="text-right">Target (₹)</TableHead>
              <TableHead>Window</TableHead>
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
                  No campaigns yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const id = String(row._id);
                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {row.image ? (
                          <Image
                            src={row.image}
                            alt=""
                            width={24}
                            height={24}
                            unoptimized
                            className="size-6 rounded object-cover"
                          />
                        ) : null}
                        {row.title}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.slug}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(row.minAmount ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.targetAmount
                        ? row.targetAmount.toLocaleString("en-IN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {windowLabel(row)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "default" : "secondary"}>
                        {row.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="bg-background sticky right-0">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/annadhana/campaigns/${id}/edit`}
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
                          resource="annadhana/campaigns"
                          id={id}
                          name={row.title}
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
