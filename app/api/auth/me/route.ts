import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({ user: session });
  } catch (error) {
    return handleApiError(error, "GET /api/auth/me error:");
  }
}
