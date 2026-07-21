import connectMongoDB from "@/lib/mongoose";
import Contact from "@/models/ContactModel";
import { contactSchema } from "@/lib/validations";
import { triggerEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const parsed = contactSchema.safeParse(await request.json());
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
    await Contact.create(parsed.data);

    triggerEmail("contact.created", {
      name: parsed.data.name,
      email: parsed.data.email,
      mobile: parsed.data.mobile,
      comments: parsed.data.comments,
    });

    return NextResponse.json({ message: "Contact Created" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create contact:", error);
    return NextResponse.json(
      { message: "Error creating contact" },
      { status: 500 },
    );
  }
}
