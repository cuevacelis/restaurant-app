import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db/queries/orders";
import { requireSession } from "@/lib/auth";
import type { OrderStatus } from "@/lib/db/queries/orders";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "in_preparation",
  "ready_to_deliver",
  "completed",
  "cancelled",
  "paid",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const order = await updateOrderStatus(id, status, session.userId);
    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("PATCH /api/orders/[id]/status error:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
