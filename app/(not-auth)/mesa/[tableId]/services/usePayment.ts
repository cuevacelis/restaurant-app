"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface PaymentMethod {
  id: string;
  name: string;
  type: "manual" | "mercadopago";
  display_text: string | null;
  sort_order: number;
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods", "public"],
    queryFn: async (): Promise<{ methods: PaymentMethod[] }> => {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Error al cargar métodos de pago");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
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
