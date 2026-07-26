"use client";

import { useCallback } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActions } from "@/components/dashboard/user-actions";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { providerLabel } from "@/lib/user-providers";
import type { UserRole, UserStatus } from "@/lib/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface UserRow {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  role: UserRole;
  status: UserStatus;
  providers: string[];
  createdAt: string;
  isEnvAdmin: boolean;
}

function initials(row: UserRow): string {
  const source = row.name ?? row.email ?? "?";
  return source
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function UsersList({
  initialItems,
  pageSize,
  currentUserId,
}: {
  initialItems: UserRow[];
  pageSize: number;
  /** Signed-in admin — their own row gets no actions (no self-lockout). */
  currentUserId: string;
}) {
  const fetchPage = useCallback(
    async (page: number, query: string): Promise<UserRow[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: UserRow[] };
      return data.items ?? [];
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
        placeholder="Search by name or email…"
        className="max-w-xs"
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Sign-in</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="bg-background sticky right-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={row.image} alt="" />
                        <AvatarFallback>{initials(row)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {row.name ?? "—"}
                          {row.id === currentUserId && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {row.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.providers.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        row.providers.map((provider) => (
                          <Badge key={provider} variant="secondary">
                            {providerLabel(provider)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.role === "admin" ? "default" : "outline"}
                      title={
                        row.isEnvAdmin
                          ? "Granted via the ADMIN_EMAILS allowlist"
                          : undefined
                      }
                    >
                      {row.isEnvAdmin ? "Admin (env)" : row.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "disabled" ? "destructive" : "secondary"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(row.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="bg-background sticky right-0">
                    <div className="flex items-center justify-end">
                      {row.id === currentUserId || row.isEnvAdmin ? (
                        <span className="text-muted-foreground pr-2 text-xs">
                          —
                        </span>
                      ) : (
                        <UserActions user={row} />
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
