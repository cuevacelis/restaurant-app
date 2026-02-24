import { NextRequest, NextResponse } from "next/server";
import { addOrderReview, getOrderById } from "@/lib/db/queries/orders";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Calificación debe ser entre 1 y 5" },
        { status: 400 }
      );
    }

    // Verify order exists and is completed
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
    console.error("POST /api/orders/[id]/review error:", error);
    return NextResponse.json({ error: "Error al guardar reseña" }, { status: 500 });
  }
}
