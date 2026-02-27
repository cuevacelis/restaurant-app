import { NextRequest, NextResponse } from "next/server";
import { getTables, createTable } from "@/lib/db/queries/tables";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const tables = await getTables();
    return NextResponse.json({ tables });
  } catch (error) {
    return handleApiError(error, "GET /api/tables error:");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [, data] = await Promise.all([requireRole(["admin"]), req.json()]);

    if (!data.number || !data.capacity) {
      return NextResponse.json(
        { error: "Número y capacidad son requeridos" },
        { status: 400 }
      );
    }

    const table = await createTable(data);
    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/tables error:");
  }
}
