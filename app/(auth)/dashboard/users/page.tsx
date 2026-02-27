"use client";

import { useState } from "react";
import { Plus, Pencil, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, type User } from "./services/useUsers";
import { ROLE_LABELS } from "@/lib/utils";

type UserForm = {
  username: string;
  password: string;
  role: string;
  name: string;
};

const EMPTY_FORM: UserForm = { username: "", password: "", role: "waiter", name: "" };

const ROLE_COLORS = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  waiter: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  chef: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

export default function UsersPage() {
  const { data, isLoading } = useUsers();
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: updateUser, isPending: updating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const [dialog, setDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);

  const users = data?.users ?? [];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialog({ open: true });
  };

  const openEdit = (user: User) => {
    setForm({ username: user.username, password: "", role: user.role, name: user.name });
    setDialog({ open: true, user });
  };

  const handleSave = () => {
    if (dialog.user) {
      const updateData: Parameters<typeof updateUser>[0]["data"] = {
        name: form.name,
        role: form.role,
      };
      if (form.password) updateData.password = form.password;
      updateUser({ id: dialog.user.id, data: updateData }, { onSuccess: () => setDialog({ open: false }) });
    } else {
      createUser(form, { onSuccess: () => setDialog({ open: false }) });
    }
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
            <Card key={user.id} className={!user.active ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{user.name}</p>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        ROLE_COLORS[user.role]
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[user.role]}
                    </span>
                    {!user.active && (
                      <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`¿Desactivar a ${user.name}?`)) deleteUser(user.id);
                    }}
                    disabled={!user.active}
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && (
            <p className="py-8 text-center text-muted-foreground text-sm">Sin usuarios</p>
          )}
        </div>
      )}

      {/* Create/edit dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.user ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Juan García"
              />
            </div>
            {!dialog.user && (
              <div className="space-y-2">
                <Label>Usuario *</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Ej. juan.garcia"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{dialog.user ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="waiter">Mesero</option>
                <option value="chef">Chef</option>
                <option value="admin">Administrador</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={
                !form.name ||
                (!dialog.user && (!form.username || !form.password)) ||
                creating || updating
              }
            >
              {creating || updating ? "Guardando..." : dialog.user ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
