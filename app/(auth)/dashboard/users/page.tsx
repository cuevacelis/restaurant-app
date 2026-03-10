"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "./services/useUsers";
import { UserCard } from "./_components/UserCard";
import { UserFormDialog } from "./_components/UserFormDialog";
import type { User, UserForm } from "./_components/_types";

export default function UsersPage() {
  const { data, isLoading } = useUsers();
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: updateUser, isPending: updating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const [dialog, setDialog] = useState<{ open: boolean; user?: User }>({ open: false });

  const users = data?.users ?? [];

  const openCreate = () => setDialog({ open: true });
  const openEdit = (user: User) => setDialog({ open: true, user });
  const closeDialog = () => setDialog({ open: false });

  const handleCreate = (form: UserForm) => {
    createUser(
      { ...form, role: form.role as "admin" | "waiter" | "chef" },
      { onSuccess: closeDialog }
    );
  };

  const handleUpdate = (
    id: string,
    data: Partial<{ name: string; role: string; active: boolean; password: string }>
  ) => {
    updateUser(
      { id, ...data, role: data.role as "admin" | "waiter" | "chef" | undefined },
      { onSuccess: closeDialog }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Usuarios</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => openEdit(user)}
              onDelete={() => {
                if (confirm(`¿Desactivar a ${user.name}?`)) deleteUser({ id: user.id });
              }}
            />
          ))}
          {users.length === 0 && (
            <p className="py-8 text-center text-muted-foreground text-sm">Sin usuarios</p>
          )}
        </div>
      )}

      <UserFormDialog
        key={`${dialog.open}-${dialog.user?.id ?? "new"}`}
        open={dialog.open}
        user={dialog.user}
        onClose={closeDialog}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isPending={creating || updating}
      />
    </div>
  );
}
