import { NextResponse } from "next/server";

// Config keys the app needs at runtime (values are never returned — presence
// booleans only, so this stays safe to expose publicly).
const REQUIRED_ENV_KEYS = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "MONGODB_URI",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SES_FROM_EMAIL",
  "AWS_REGION",
] as const;

export function GET() {
  const env = Object.fromEntries(
    REQUIRED_ENV_KEYS.map((key) => [key, Boolean(process.env[key])]),
  );
  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key]);

  return NextResponse.json(
    { status: missing.length === 0 ? "ok" : "degraded", env },
    { status: missing.length === 0 ? 200 : 503 },
  );
}
