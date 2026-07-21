import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongoose";
import Student from "@/models/StudentModel";
import { requireAdmin } from "@/lib/admin-auth";
import { sponsorshipCreateSchema } from "@/lib/validations";
import { recordManualSponsorship } from "@/lib/sponsorships";
import { triggerEmail } from "@/lib/email";

type Context = { params: Promise<{ id: string }> };

/**
 * Manually record a sponsorship for a student (admin), capturing donor details
 * against the student for a given year. Marked received immediately.
 */
export async function POST(request: Request, ctx: Context) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sponsorshipCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;
  const data = parsed.data;
  const year = data.year ?? new Date().getFullYear();

  try {
    await connectMongoDB();

    const student = await Student.findById(id)
      .lean<{ _id: unknown; name: string; student_id: string }>()
      .exec();
    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    const sponsorship = await recordManualSponsorship(
      {
        studentId: id,
        studentName: student.name,
        year,
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        donorPhone: data.donorPhone,
        amount: data.amount,
        currency: data.currency,
        note: data.note,
      },
      auth.actor,
    );

    triggerEmail("student.sponsored", {
      sponsorName: data.donorName,
      sponsorEmail: data.donorEmail,
      studentName: student.name,
      studentId: student.student_id,
      amount: data.amount,
      currency: data.currency ?? "INR",
    });

    return NextResponse.json(sponsorship, { status: 201 });
  } catch (error) {
    console.error("[admin] sponsorship failed", error);
    return NextResponse.json(
      { message: "Could not record the sponsorship" },
      { status: 500 },
    );
  }
}
