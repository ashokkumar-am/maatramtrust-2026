import connectMongoDB from "@/lib/mongoose";
import Banner from "@/models/BannerModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { BannerDialog } from "@/components/dashboard/banner-dialog";
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
  title?: string;
  mediaType: "image" | "video";
  url: string;
  public_id: string;
  alt?: string;
  caption?: string;
  order?: number;
  isActive?: boolean;
  link?: string;
}

export const metadata = { title: "Banners · Maatram Admin" };

export default async function AdminBannersPage() {
  await requireAdminPage("/dashboard/banners");
  await connectMongoDB();

  const rows = await Banner.find()
    .sort({ order: 1, createdAt: -1 })
    .limit(LIMIT)
    .select("title mediaType url public_id alt caption order isActive link")
    .lean<Row[]>()
    .exec();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length} homepage banners.
          </p>
        </div>
        <BannerDialog />
      </header>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Media</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No banners yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={String(row._id)}>
                  <TableCell className="font-medium">
                    {row.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.mediaType}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.order ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {row.link ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? "default" : "secondary"}>
                      {row.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="bg-background sticky right-0">
                    <div className="flex items-center justify-end gap-2">
                      <BannerDialog
                        banner={{
                          id: String(row._id),
                          title: row.title,
                          mediaType: row.mediaType,
                          url: row.url,
                          public_id: row.public_id,
                          alt: row.alt,
                          caption: row.caption,
                          link: row.link,
                          order: row.order,
                          isActive: row.isActive,
                        }}
                      />
                      <DeleteButton
                        resource="banners"
                        id={String(row._id)}
                        name={row.title || "banner"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
