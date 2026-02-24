import { NextRequest, NextResponse } from "next/server";
import { getTableById, updateTable, deleteTable } from "@/lib/db/queries/tables";
import { requireRole } from "@/lib/auth";

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
    console.error(error);
    return NextResponse.json({ error: "Error al obtener mesa" }, { status: 500 });
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
    const table = await updateTable(id, data);
    if (!table) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ table });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar mesa" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    await deleteTable(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar mesa" }, { status: 500 });
  }
}
