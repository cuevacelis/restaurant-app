"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export interface PaymentMethod {
  id: string;
  name: string;
  type: "manual" | "mercadopago";
  display_text: string | null;
  sort_order: number;
}

export function usePaymentMethods() {
  const trpc = useTRPC();
  return useQuery(trpc.payments.list.queryOptions());
}

export function useCreateMPPreference(orderId: string) {
  return useMutation({
    mutationFn: async (): Promise<{ init_point: string; sandbox_init_point: string }> => {
      const res = await fetch(`/api/orders/${orderId}/payment/mp-preference`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al crear preferencia de pago");
      }
      return res.json();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
