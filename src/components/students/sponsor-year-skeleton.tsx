import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PLACEHOLDER_KEYS = ["a", "b"];

/** Suspense fallback matching the funding summary + year card layout. */
export function SponsorYearSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {PLACEHOLDER_KEYS.map((key) => (
        <Card key={key}>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
