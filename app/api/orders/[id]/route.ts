import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/queries/orders";
import { handleApiError } from "@/lib/api-error";

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
    return handleApiError(error, "GET /api/orders/[id] error:");
  }
}
