import { NextRequest, NextResponse } from "next/server";
import { getTableById, updateTable, deleteTable } from "@/lib/db/queries/tables";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const table = await getTableById(id);
    if (!table) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ table });
  } catch (error) {
    return handleApiError(error, "GET /api/tables/[id] error:");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // auth, params, and body are all independent — run in parallel
    const [, { id }, data] = await Promise.all([
      requireRole(["admin"]),
      params,
      req.json(),
    ]);
    const table = await updateTable(id, data);
    if (!table) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ table });
  } catch (error) {
    return handleApiError(error, "PATCH /api/tables/[id] error:");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // auth and params are independent — run in parallel
    const [, { id }] = await Promise.all([requireRole(["admin"]), params]);
    await deleteTable(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/tables/[id] error:");
  }
}
