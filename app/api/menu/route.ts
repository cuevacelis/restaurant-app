import { NextRequest, NextResponse } from "next/server";
import { getMenuItems, createMenuItem } from "@/lib/db/queries/menu";
import { getCategories } from "@/lib/db/queries/menu";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const availableOnly = searchParams.get("availableOnly") !== "false";

    const [items, categories] = await Promise.all([
      getMenuItems({ categoryId, availableOnly }),
      getCategories(),
    ]);

    return NextResponse.json({ items, categories });
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json({ error: "Error al obtener menú" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const data = await req.json();

    if (!data.name || data.price === undefined) {
      return NextResponse.json(
        { error: "Nombre y precio son requeridos" },
        { status: 400 }
      );
    }

    const item = await createMenuItem(data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("POST /api/menu error:", error);
    return NextResponse.json({ error: "Error al crear ítem" }, { status: 500 });
  }
}
