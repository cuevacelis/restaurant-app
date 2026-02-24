import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrderById, updateOrderItems, appendOrderItems } from "@/lib/db/queries/orders";

// Customer: append new items (only when order is pending)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Solo se pueden agregar ítems a pedidos pendientes" }, { status: 400 });
    }

    const { items } = await req.json();
    if (!items?.length) {
      return NextResponse.json({ error: "No hay ítems para agregar" }, { status: 400 });
    }

    const updated = await appendOrderItems(id, items);
    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("POST /api/orders/[id]/items error:", error);
    return NextResponse.json({ error: "Error al agregar ítems" }, { status: 500 });
  }
}

// Staff (admin/waiter): full replace of all items
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!["admin", "waiter"].includes(session.role)) {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }

    const { id } = await params;
    const { items } = await req.json();
    if (!items?.length) {
      return NextResponse.json({ error: "El pedido debe tener al menos un ítem" }, { status: 400 });
    }

    const updated = await updateOrderItems(id, items);
    if (!updated) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("PUT /api/orders/[id]/items error:", error);
    return NextResponse.json({ error: "Error al actualizar ítems" }, { status: 500 });
  }
}
