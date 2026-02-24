import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/queries/orders";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Error al obtener pedido" }, { status: 500 });
  }
}
