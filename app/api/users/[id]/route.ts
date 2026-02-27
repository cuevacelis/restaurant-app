import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { updateUser, deleteUser } from "@/lib/db/queries/auth";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // auth, params, and body are all independent — run in parallel
    const [, { id }, { name, role, active, password }] = await Promise.all([
      requireRole(["admin"]),
      params,
      req.json(),
    ]);

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
  } catch (error) {
    return handleApiError(error, "PATCH /api/users/[id] error:");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // auth and params are independent — run in parallel
    const [, { id }] = await Promise.all([requireRole(["admin"]), params]);
    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/users/[id] error:");
  }
}
