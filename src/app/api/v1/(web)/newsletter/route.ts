import connectMongoDB from "@/lib/mongoose";
import Newsletter from "@/models/NewsletterModel";
import { newsletterSchema } from "@/lib/validations";
import { triggerEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const parsed = newsletterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid request",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await connectMongoDB();

    const existing = await Newsletter.findOne({ email: parsed.data.email });
    if (existing) {
      return NextResponse.json(
        { message: "Already subscribed" },
        { status: 409 },
      );
    }

    await Newsletter.create(parsed.data);

    triggerEmail("newsletter.subscribed", { email: parsed.data.email });

    return NextResponse.json({ message: "Subscribed" }, { status: 201 });
  } catch (error) {
    console.error("Failed to subscribe to newsletter:", error);
    return NextResponse.json(
      { message: "Error subscribing to newsletter" },
      { status: 500 },
    );
  }
}
