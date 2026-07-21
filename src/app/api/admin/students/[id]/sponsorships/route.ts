import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getStudentSponsorshipsByYear } from "@/lib/sponsorships";

type Context = { params: Promise<{ id: string }> };

/**
 * Year-wise sponsorship history for a student (admin): donor details grouped by
 * year, with per-year pledged/received totals.
 */
export async function GET(_request: Request, ctx: Context) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const years = await getStudentSponsorshipsByYear(id);

  return NextResponse.json({ studentId: id, years });
}
