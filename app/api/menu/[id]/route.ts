import { NextRequest, NextResponse } from "next/server";
import { getMenuItemById, updateMenuItem, deleteMenuItem } from "@/lib/db/queries/menu";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getMenuItemById(id);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return handleApiError(error, "GET /api/menu/[id] error:");
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
    const item = await updateMenuItem(id, data);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return handleApiError(error, "PATCH /api/menu/[id] error:");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // auth and params are independent — run in parallel
    const [, { id }] = await Promise.all([requireRole(["admin"]), params]);
    const deleted = await deleteMenuItem(id);
    if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/menu/[id] error:");
  }
}
