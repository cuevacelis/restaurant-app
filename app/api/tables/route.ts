import { NextRequest, NextResponse } from "next/server";
import { getTables, createTable } from "@/lib/db/queries/tables";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const tables = await getTables();
    return NextResponse.json({ tables });
  } catch (error) {
    console.error("GET /api/tables error:", error);
    return NextResponse.json({ error: "Error al obtener mesas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const data = await req.json();

    if (!data.number || !data.capacity) {
      return NextResponse.json(
        { error: "Número y capacidad son requeridos" },
        { status: 400 }
      );
    }

    const table = await createTable(data);
    return NextResponse.json({ table }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("POST /api/tables error:", error);
    return NextResponse.json({ error: "Error al crear mesa" }, { status: 500 });
  }
}
