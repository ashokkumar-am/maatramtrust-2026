import { NextResponse, type NextRequest } from "next/server";

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

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message.slice(0, 300)}`;
  }
  return String(error).slice(0, 300);
}

/**
 * Exercise the app's critical dependencies and report failures by name.
 * Dynamic imports on purpose: a module that throws while loading (the
 * current production failure mode) rejects here instead of crashing the
 * whole route before the handler runs.
 */
async function deepChecks(): Promise<Record<string, string>> {
  const checks: Record<string, string> = {};
  try {
    const { default: clientPromise } = await import("@/lib/mongodb");
    const client = await clientPromise;
    // The client connects lazily, so awaiting it proves nothing — ping.
    await client.db().command({ ping: 1 });
    checks.mongoClient = "ok";
  } catch (error) {
    checks.mongoClient = describeError(error);
  }
  try {
    const { default: connectMongoDB } = await import("@/lib/mongoose");
    await connectMongoDB();
    checks.mongoose = "ok";
  } catch (error) {
    checks.mongoose = describeError(error);
  }
  try {
    const { auth } = await import("@/auth");
    await auth();
    checks.auth = "ok";
  } catch (error) {
    checks.auth = describeError(error);
  }
  return checks;
}

export async function GET(request: NextRequest) {
  const env = Object.fromEntries(
    REQUIRED_ENV_KEYS.map((key) => [key, Boolean(process.env[key])]),
  );
  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key]);

  const deep = request.nextUrl.searchParams.has("deep")
    ? await deepChecks()
    : undefined;
  const deepFailed =
    deep !== undefined && Object.values(deep).some((v) => v !== "ok");

  const healthy = missing.length === 0 && !deepFailed;
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", env, ...(deep && { deep }) },
    { status: healthy ? 200 : 503 },
  );
}
