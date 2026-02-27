import { NextRequest, NextResponse } from "next/server";
import { addOrderReview, getOrderById } from "@/lib/db/queries/orders";
import { handleApiError } from "@/lib/api-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params and body are independent — run in parallel
    const [{ id }, { rating, comment }] = await Promise.all([params, req.json()]);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Calificación debe ser entre 1 y 5" },
        { status: 400 }
      );
    }

    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (order.status !== "completed") {
      return NextResponse.json(
        { error: "Solo se puede calificar pedidos completados" },
        { status: 400 }
      );
    }

    const updated = await addOrderReview(id, { rating, comment });
    return NextResponse.json({ order: updated });
  } catch (error) {
    return handleApiError(error, "POST /api/orders/[id]/review error:");
  }
}
