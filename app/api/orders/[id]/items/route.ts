import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrderById, updateOrderItems, appendOrderItems } from "@/lib/db/queries/orders";
import { handleApiError } from "@/lib/api-error";

// Customer: append new items (only when order is pending)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params and body are independent — run in parallel
    const [{ id }, { items }] = await Promise.all([params, req.json()]);

    if (!items?.length) {
      return NextResponse.json({ error: "No hay ítems para agregar" }, { status: 400 });
    }

    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Solo se pueden agregar ítems a pedidos pendientes" }, { status: 400 });
    }

    const updated = await appendOrderItems(id, items);
    return NextResponse.json({ order: updated });
  } catch (error) {
    return handleApiError(error, "POST /api/orders/[id]/items error:");
  }
}

// Staff (admin/waiter): full replace of all items
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // session, params, and body are all independent — run in parallel
    const [session, { id }, { items }] = await Promise.all([
      getSession(),
      params,
      req.json(),
    ]);

    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!["admin", "waiter"].includes(session.role)) {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }
    if (!items?.length) {
      return NextResponse.json({ error: "El pedido debe tener al menos un ítem" }, { status: 400 });
    }

    const updated = await updateOrderItems(id, items);
    if (!updated) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    return NextResponse.json({ order: updated });
  } catch (error) {
    return handleApiError(error, "PUT /api/orders/[id]/items error:");
  }
}
