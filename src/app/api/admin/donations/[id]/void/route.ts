import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { voidDonation } from "@/lib/donations";
import { voidDonationSchema } from "@/lib/validations";

/**
 * Void/refund a captured donation (soft — kept for audit as "refunded"). It
 * immediately stops counting toward totals and drops off the public wall.
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  // Body (with an optional reason) is optional.
  let reason: string | undefined;
  try {
    const parsed = voidDonationSchema.safeParse(await request.json());
    if (parsed.success) reason = parsed.data.reason;
  } catch {
    reason = undefined;
  }

  const updated = await voidDonation({ id, reason, actor: auth.actor });
  if (!updated) {
    return NextResponse.json(
      { message: "Not found or not a captured donation." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
