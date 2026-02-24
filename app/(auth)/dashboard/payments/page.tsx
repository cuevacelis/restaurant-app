"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CreditCard, Smartphone, Banknote, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton } from "@/components/ui/dialog";

interface PaymentMethod {
  id: string;
  name: string;
  type: "manual" | "mercadopago";
  display_text: string | null;
  config: Record<string, string>;
  active: boolean;
  sort_order: number;
}

const TYPE_LABELS: Record<string, string> = {
  manual: "Manual",
  mercadopago: "MercadoPago",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  manual: Banknote,
  mercadopago: CreditCard,
};

async function fetchMethods(): Promise<{ methods: PaymentMethod[] }> {
  const res = await fetch("/api/payment-methods");
  if (!res.ok) throw new Error("Error al cargar");
  return res.json();
}

// ── Form dialog ───────────────────────────────────────────────
interface FormState {
  name: string;
  type: "manual" | "mercadopago";
  display_text: string;
  access_token: string;
  sort_order: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  type: "manual",
  display_text: "",
  access_token: "",
  sort_order: "0",
  active: true,
};

function PaymentMethodDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: PaymentMethod | null;
}) {
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
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
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
        <DialogCloseButton onClose={onClose} />
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

// ── Main page ─────────────────────────────────────────────────
export default function PaymentsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["payment-methods", "admin"],
    queryFn: fetchMethods,
  });

  const { mutate: deleteMethod } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      toast.success("Método desactivado");
      qc.invalidateQueries({ queryKey: ["payment-methods", "admin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditing(m);
    setDialogOpen(true);
  };

  const methods = data?.methods ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Métodos de pago</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura los métodos de pago disponibles para tus clientes
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo método
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>No hay métodos de pago. Crea el primero.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const Icon = TYPE_ICONS[m.type] ?? Smartphone;
            return (
              <Card key={m.id} className={!m.active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{m.name}</p>
                        <Badge variant="outline" className="text-xs">{TYPE_LABELS[m.type]}</Badge>
                        {!m.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactivo</Badge>}
                      </div>
                      {m.display_text && (
                        <p className="text-sm text-muted-foreground truncate">{m.display_text}</p>
                      )}
                      {m.type === "mercadopago" && (
                        <p className="text-xs text-muted-foreground">
                          Token: {m.config?.access_token ? "••••••••••••" : "No configurado"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMethod(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Separator />

      {/* Info card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Sobre los métodos de pago</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Manual</strong>: El cliente ve las instrucciones y el mesero confirma el pago manualmente.</p>
          <p><strong>MercadoPago</strong>: El cliente paga con tarjeta o billetera virtual. Requiere un Access Token de producción.</p>
          <p>Para webhooks de MercadoPago en producción, configura la URL: <code className="bg-background px-1 rounded">{process.env.NEXT_PUBLIC_APP_URL ?? "[TU_DOMINIO]"}/api/webhooks/mercadopago</code></p>
        </CardContent>
      </Card>

      <PaymentMethodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
      />
    </div>
  );
}
