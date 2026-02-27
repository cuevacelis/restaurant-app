import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByUsername } from "@/lib/db/queries/auth";
import { createSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role, name: user.name },
    });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/login error:");
  }
}
