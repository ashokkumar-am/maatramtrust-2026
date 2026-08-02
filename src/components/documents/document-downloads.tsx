import { Download, FileText } from "lucide-react";
import type { getPublicDocumentGroups } from "@/lib/documents";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatSize(bytes?: number): string | null {
  if (!bytes) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

/** Published annual reports and tax documents, grouped by type. */
export function DocumentDownloads({
  groups,
}: {
  groups: Awaited<ReturnType<typeof getPublicDocumentGroups>>;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground">
        No documents have been published yet. Please check back soon.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.type}>
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            {group.label}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.documents.map((doc) => {
              const size = formatSize(doc.size);
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <FileText className="text-muted-foreground size-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {doc.title || `${group.label} ${doc.year}`}
                      </span>
                      <Badge variant="secondary">{doc.year}</Badge>
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {doc.fileName}
                      {size ? ` · ${size}` : ""}
                    </div>
                  </div>
                  <a
                    href={`/api/v1/documents/${doc.id}/download`}
                    rel="noopener"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    <Download className="size-3" />
                    Download
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
