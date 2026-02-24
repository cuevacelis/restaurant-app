import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/db/queries/orders";
import { getAllPaymentMethods } from "@/lib/db/queries/payments";
import { getPaymentById } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const dataId = searchParams.get("data.id");

    // MercadoPago can also send JSON body
    let paymentId = dataId;
    if (!paymentId) {
      try {
        const body = await req.json();
        paymentId = body?.data?.id?.toString();
        if (body?.type && body.type !== "payment") {
          return NextResponse.json({ ok: true });
        }
      } catch {
        // ignore parse error
      }
    }

    if ((type && type !== "payment") || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    const methods = await getAllPaymentMethods();
    const mpMethod = methods.find((m) => m.type === "mercadopago" && m.active);
    if (!mpMethod?.config?.access_token) {
      return NextResponse.json({ error: "MP not configured" }, { status: 400 });
    }

    const payment = await getPaymentById(mpMethod.config.access_token, paymentId);

    if (payment.status === "approved" && payment.external_reference) {
      const order = await getOrderById(payment.external_reference);
      if (order && order.status === "completed") {
        await updateOrderStatus(payment.external_reference, "paid");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MP webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
