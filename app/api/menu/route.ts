import { NextRequest, NextResponse } from "next/server";
import { getMenuItems, createMenuItem, getCategories } from "@/lib/db/queries/menu";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

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
    return handleApiError(error, "GET /api/menu error:");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [, data] = await Promise.all([requireRole(["admin"]), req.json()]);

    if (!data.name || data.price === undefined) {
      return NextResponse.json(
        { error: "Nombre y precio son requeridos" },
        { status: 400 }
      );
    }

    const item = await createMenuItem(data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/menu error:");
  }
}
