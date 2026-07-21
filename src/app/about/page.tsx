import { Download, FileText } from "lucide-react";
import { getPublicDocumentGroups } from "@/lib/documents";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "About · Maatram",
  description:
    "About Maatram, and our published annual reports and tax documents.",
};

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

export default async function AboutPage() {
  const groups = await getPublicDocumentGroups();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">About Maatram</h1>
        <p className="text-muted-foreground mt-3">
          Maatram works to keep deserving students in education through
          sponsorships and community support. In the interest of transparency,
          we publish our annual reports and tax filings below.
        </p>
      </header>

      <section aria-labelledby="documents-heading">
        <h2
          id="documents-heading"
          className="mb-1 text-xl font-semibold tracking-tight"
        >
          Reports &amp; Documents
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Download our published documents, year by year.
        </p>

        {groups.length === 0 ? (
          <p className="text-muted-foreground">
            No documents have been published yet. Please check back soon.
          </p>
        ) : (
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
        )}
      </section>
    </main>
  );
}
