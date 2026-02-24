import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { updateUser, deleteUser } from "@/lib/db/queries/auth";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const { name, role, active, password } = await req.json();

    const updateData: Parameters<typeof updateUser>[1] = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const user = await updateUser(id, updateData);
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role, name: user.name, active: user.active },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
