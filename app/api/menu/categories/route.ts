import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/db/queries/menu";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return handleApiError(error, "GET /api/menu/categories error:");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [, data] = await Promise.all([requireRole(["admin"]), req.json()]);
    if (!data.name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }
    const category = await createCategory(data);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/menu/categories error:");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const [, { id, ...data }] = await Promise.all([requireRole(["admin"]), req.json()]);
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const category = await updateCategory(id, data);
    return NextResponse.json({ category });
  } catch (error) {
    return handleApiError(error, "PATCH /api/menu/categories error:");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/menu/categories error:");
  }
}
