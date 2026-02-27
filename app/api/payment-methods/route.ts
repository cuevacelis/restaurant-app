import { NextRequest, NextResponse } from "next/server";
import {
  getActivePaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
} from "@/lib/db/queries/payments";
import { getSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await getSession();
    const methods =
      session?.role === "admin"
        ? await getAllPaymentMethods()
        : await getActivePaymentMethods();
    return NextResponse.json({ methods });
  } catch (error) {
    return handleApiError(error, "GET /api/payment-methods error:");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [, data] = await Promise.all([requireRole(["admin"]), req.json()]);
    if (!data.name || !data.type) {
      return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
    }
    const method = await createPaymentMethod(data);
    return NextResponse.json({ method }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/payment-methods error:");
  }
}
