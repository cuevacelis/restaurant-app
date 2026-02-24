import { NextRequest, NextResponse } from "next/server";
import { getMenuItemById, updateMenuItem, deleteMenuItem } from "@/lib/db/queries/menu";
import { requireRole } from "@/lib/auth";

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
    console.error("GET /api/menu/[id] error:", error);
    return NextResponse.json({ error: "Error al obtener ítem" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const data = await req.json();
    const item = await updateMenuItem(id, data);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("PATCH /api/menu/[id] error:", error);
    return NextResponse.json({ error: "Error al actualizar ítem" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const deleted = await deleteMenuItem(id);
    if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("DELETE /api/menu/[id] error:", error);
    return NextResponse.json({ error: "Error al eliminar ítem" }, { status: 500 });
  }
}
