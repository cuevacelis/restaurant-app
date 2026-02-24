import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { updateOrderTable } from "@/lib/db/queries/orders";
import { getTableById } from "@/lib/db/queries/tables";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin", "waiter"]);
    const { id } = await params;
    const { table_id } = await req.json();

    if (table_id) {
      const table = await getTableById(table_id);
      if (!table) return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    const order = await updateOrderTable(id, table_id ?? null);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }
    console.error("PATCH /api/orders/[id]/table error:", error);
    return NextResponse.json({ error: "Error al cambiar mesa" }, { status: 500 });
  }
}
