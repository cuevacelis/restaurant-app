import { NextRequest, NextResponse } from "next/server";
import { updatePaymentMethod, deletePaymentMethod } from "@/lib/db/queries/payments";
import { requireRole } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const data = await req.json();
    const method = await updatePaymentMethod(id, data);
    if (!method) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ method });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden")
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    await deletePaymentMethod(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden")
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
