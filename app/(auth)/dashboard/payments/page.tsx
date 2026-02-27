"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePaymentMethods, useDeletePaymentMethod } from "./services/usePayments";
import { PaymentCard } from "./_components/PaymentCard";
import { PaymentMethodDialog } from "./_components/PaymentMethodDialog";
import type { PaymentMethod } from "./_components/_types";

export default function PaymentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);

  const { data, isLoading } = usePaymentMethods();
  const { mutate: deleteMethod } = useDeletePaymentMethod();

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
          {methods.map((m) => (
            <PaymentCard
              key={m.id}
              method={m}
              onEdit={() => openEdit(m)}
              onDelete={() => deleteMethod(m.id)}
            />
          ))}
        </div>
      )}

      <Separator />

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Sobre los métodos de pago</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Manual</strong>: El cliente ve las instrucciones y el mesero confirma el pago manualmente.</p>
          <p><strong>MercadoPago</strong>: El cliente paga con tarjeta o billetera virtual. Requiere un Access Token de producción.</p>
          <p>
            Para webhooks de MercadoPago en producción, configura la URL:{" "}
            <code className="bg-background px-1 rounded">
              {process.env.NEXT_PUBLIC_APP_URL ?? "[TU_DOMINIO]"}/api/webhooks/mercadopago
            </code>
          </p>
        </CardContent>
      </Card>

      <PaymentMethodDialog
        key={`${dialogOpen}-${editing?.id ?? "new"}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
      />
    </div>
  );
}
