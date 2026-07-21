import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";

// The spec is static, so it can be prerendered.
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(openApiSpec);
}
