import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/db/queries/orders";
import { getTableByNumber } from "@/lib/db/queries/tables";
import { handleApiError } from "@/lib/api-error";
import type { OrderStatus } from "@/lib/db/queries/orders";

// UUID v4 regex
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as OrderStatus | undefined;
    const tableId = searchParams.get("tableId") ?? undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;

    const orders = await getOrders({ status, tableId, limit, offset });
    return NextResponse.json({ orders });
  } catch (error) {
    return handleApiError(error, "GET /api/orders error:");
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.customer_name || !data.order_type || !data.items?.length) {
      return NextResponse.json(
        { error: "Datos de pedido incompletos" },
        { status: 400 }
      );
    }

    // Si table_id es un número de mesa (no UUID), resolvemos al UUID real
    if (data.table_id && !UUID_RE.test(data.table_id)) {
      const tableNumber = parseInt(data.table_id, 10);
      if (!isNaN(tableNumber)) {
        const table = await getTableByNumber(tableNumber);
        if (!table) {
          return NextResponse.json({ error: `Mesa #${tableNumber} no encontrada` }, { status: 404 });
        }
        data.table_id = table.id;
      }
    }

    const order = await createOrder(data);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/orders error:");
  }
}
