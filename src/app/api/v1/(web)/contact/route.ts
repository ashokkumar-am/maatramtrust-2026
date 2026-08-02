import { createContact } from "@/lib/contacts";
import { contactSchema } from "@/lib/validations";
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

    await createContact(parsed.data);

    return NextResponse.json({ message: "Contact Created" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create contact:", error);
    return NextResponse.json(
      { message: "Error creating contact" },
      { status: 500 },
    );
  }
}
