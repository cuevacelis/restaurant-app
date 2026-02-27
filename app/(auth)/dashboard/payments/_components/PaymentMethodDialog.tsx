"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EMPTY_FORM } from "./_types";
import type { FormState, PaymentMethod } from "./_types";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: PaymentMethod | null;
}

export function PaymentMethodDialog({ open, onClose, editing }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(
    editing
      ? {
          name: editing.name,
          type: editing.type,
          display_text: editing.display_text ?? "",
          access_token: editing.config?.access_token ?? "",
          sort_order: String(editing.sort_order),
          active: editing.active,
        }
      : EMPTY_FORM
  );
  const [showToken, setShowToken] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormState) => {
      const payload = {
        name: data.name,
        type: data.type,
        display_text: data.display_text || null,
        config: data.type === "mercadopago" ? { access_token: data.access_token } : {},
        sort_order: parseInt(data.sort_order) || 0,
        active: data.active,
      };
      const url = editing ? `/api/payment-methods/${editing.id}` : "/api/payment-methods";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editing ? "Método actualizado" : "Método creado");
      qc.invalidateQueries({ queryKey: ["payment-methods", "admin"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar método de pago" : "Nuevo método de pago"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ej. Yape, Efectivo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="manual">Manual</option>
                <option value="mercadopago">MercadoPago</option>
              </select>
            </div>
          </div>

          {form.type === "manual" && (
            <div className="space-y-1.5">
              <Label>Instrucciones para el cliente</Label>
              <Textarea
                value={form.display_text}
                onChange={(e) => set("display_text", e.target.value)}
                placeholder="Ej. Paga yapeando al +51957161949 o haz click aquí"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Este texto se muestra al cliente cuando elige este método.
              </p>
            </div>
          )}

          {form.type === "mercadopago" && (
            <div className="space-y-1.5">
              <Label>Access Token de MercadoPago</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={form.access_token}
                  onChange={(e) => set("access_token", e.target.value)}
                  placeholder="APP_USR-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowToken((s) => !s)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtenlo en{" "}
                <span className="font-mono">mercadopago.com/developers → Credenciales</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Orden de aparición</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", e.target.value)}
                min="0"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="active">Activo</Label>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => mutate(form)}
            disabled={isPending || !form.name}
          >
            {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear método"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
