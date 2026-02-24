import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAllUsers, createUser } from "@/lib/db/queries/auth";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["admin"]);
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const { username, password, role, name } = await req.json();

    if (!username || !password || !role || !name) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (!["admin", "waiter", "chef"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ username, passwordHash, role, name });

    return NextResponse.json(
      { user: { id: user.id, username: user.username, role: user.role, name: user.name } },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 });
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
