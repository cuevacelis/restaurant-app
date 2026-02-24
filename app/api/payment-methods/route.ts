import { NextRequest, NextResponse } from "next/server";
import {
  getActivePaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
} from "@/lib/db/queries/payments";
import { getSession, requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    const methods =
      session?.role === "admin"
        ? await getAllPaymentMethods()
        : await getActivePaymentMethods();
    return NextResponse.json({ methods });
  } catch (error) {
    console.error("GET /api/payment-methods error:", error);
    return NextResponse.json({ error: "Error al obtener métodos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const data = await req.json();
    if (!data.name || !data.type) {
      return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
    }
    const method = await createPaymentMethod(data);
    return NextResponse.json({ method }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden")
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    console.error("POST /api/payment-methods error:", error);
    return NextResponse.json({ error: "Error al crear método" }, { status: 500 });
  }
}
