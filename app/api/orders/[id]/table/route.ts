import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { updateOrderTable } from "@/lib/db/queries/orders";
import { getTableById } from "@/lib/db/queries/tables";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // auth, params, and body are all independent — run in parallel
    const [, { id }, { table_id }] = await Promise.all([
      requireRole(["admin", "waiter"]),
      params,
      req.json(),
    ]);

    if (table_id) {
      const table = await getTableById(table_id);
      if (!table) return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    const order = await updateOrderTable(id, table_id ?? null);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error) {
    return handleApiError(error, "PATCH /api/orders/[id]/table error:");
  }
}
