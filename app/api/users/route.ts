import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAllUsers, createUser } from "@/lib/db/queries/auth";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    await requireRole(["admin"]);
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error, "GET /api/users error:");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [, { username, password, role, name }] = await Promise.all([
      requireRole(["admin"]),
      req.json(),
    ]);

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
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 });
    }
    return handleApiError(error, "POST /api/users error:");
  }
}
