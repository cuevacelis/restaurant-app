import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db/queries/orders";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import type { OrderStatus } from "@/lib/db/queries/orders";

// Set for O(1) lookups
const VALID_STATUSES = new Set<OrderStatus>([
  "pending",
  "in_preparation",
  "ready_to_deliver",
  "completed",
  "cancelled",
  "paid",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // session, params, and body are all independent — run in parallel
    const [session, { id }, { status }] = await Promise.all([
      requireSession(),
      params,
      req.json(),
    ]);

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const order = await updateOrderStatus(id, status, session.userId);
    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error) {
    return handleApiError(error, "PATCH /api/orders/[id]/status error:");
  }
}
