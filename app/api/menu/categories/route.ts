import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/db/queries/menu";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/menu/categories error:", error);
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const data = await req.json();
    if (!data.name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }
    const category = await createCategory(data);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("POST /api/menu/categories error:", error);
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const category = await updateCategory(id, data);
    return NextResponse.json({ category });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("PATCH /api/menu/categories error:", error);
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("DELETE /api/menu/categories error:", error);
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}
