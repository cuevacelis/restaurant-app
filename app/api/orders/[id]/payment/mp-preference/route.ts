import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/queries/orders";
import { getAllPaymentMethods } from "@/lib/db/queries/payments";
import { createPreference } from "@/lib/mercadopago";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    if (!["completed"].includes(order.status)) {
      return NextResponse.json({ error: "El pedido aún no está listo para pagar" }, { status: 400 });
    }

    const methods = await getAllPaymentMethods();
    const mpMethod = methods.find((m) => m.type === "mercadopago" && m.active);
    if (!mpMethod) {
      return NextResponse.json({ error: "MercadoPago no está configurado" }, { status: 400 });
    }
    const accessToken = mpMethod.config?.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "Token de MercadoPago no configurado" }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${req.headers.get("host")}`;

    const preference = await createPreference(accessToken, {
      orderId: id,
      title: `Pedido #${id.slice(0, 8).toUpperCase()} — Restaurante`,
      amount: parseFloat(order.total_amount),
      currency: "PEN",
      backUrlBase: baseUrl,
      tableId: order.table_number?.toString(),
    });

    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id: preference.id,
    });
  } catch (error) {
    console.error("MP preference error:", error);
    return NextResponse.json({ error: "Error al crear preferencia de pago" }, { status: 500 });
  }
}
