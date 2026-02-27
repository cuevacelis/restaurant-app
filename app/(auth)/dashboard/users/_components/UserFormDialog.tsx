"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EMPTY_FORM } from "./_types";
import type { User, UserForm } from "./_types";

interface Props {
  open: boolean;
  user?: User;
  onClose: () => void;
  onCreate: (form: UserForm) => void;
  onUpdate: (id: string, data: Partial<{ name: string; role: string; active: boolean; password: string }>) => void;
  isPending: boolean;
}

export function UserFormDialog({ open, user, onClose, onCreate, onUpdate, isPending }: Props) {
  const [form, setForm] = useState<UserForm>(
    user ? { username: user.username, password: "", role: user.role, name: user.name } : EMPTY_FORM
  );

  const handleSave = () => {
    if (user) {
      const data: Partial<{ name: string; role: string; active: boolean; password: string }> = {
        name: form.name,
        role: form.role,
      };
      if (form.password) data.password = form.password;
      onUpdate(user.id, data);
    } else {
      onCreate(form);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
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
          {!user && (
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
            <Label>{user ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol *</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="waiter">Mesero</option>
              <option value="chef">Chef</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={
              !form.name ||
              (!user && (!form.username || !form.password)) ||
              isPending
            }
          >
            {isPending ? "Guardando..." : user ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
