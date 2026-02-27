import { NextRequest, NextResponse } from "next/server";
import { updatePaymentMethod, deletePaymentMethod } from "@/lib/db/queries/payments";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    // auth, params, and body are all independent — run in parallel
    const [, { id }, data] = await Promise.all([
      requireRole(["admin"]),
      params,
      req.json(),
    ]);
    const method = await updatePaymentMethod(id, data);
    if (!method) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ method });
  } catch (error) {
    return handleApiError(error, "PATCH /api/payment-methods/[id] error:");
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    // auth and params are independent — run in parallel
    const [, { id }] = await Promise.all([requireRole(["admin"]), params]);
    await deletePaymentMethod(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/payment-methods/[id] error:");
  }
}
