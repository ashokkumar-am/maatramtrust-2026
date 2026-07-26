import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/users";

/**
 * List everyone who has signed in (paginated, `?q=` searches name/email).
 * Read-only: role/status changes go through the Server Actions in
 * `src/app/actions/users.ts`, which carry the self/allowlist protections.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 50;
  const q = searchParams.get("q") ?? undefined;

  const { items, total } = await listAdminUsers({ page, limit, q });
  return NextResponse.json({ items, total });
}
