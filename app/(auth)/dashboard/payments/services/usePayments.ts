"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PaymentMethod } from "../_components/_types";

async function fetchMethods(): Promise<{ methods: PaymentMethod[] }> {
  const res = await fetch("/api/payment-methods");
  if (!res.ok) throw new Error("Error al cargar");
  return res.json();
}

async function deleteMethod(id: string) {
  const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar");
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods", "admin"],
    queryFn: fetchMethods,
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMethod,
    onSuccess: () => {
      toast.success("Método desactivado");
      qc.invalidateQueries({ queryKey: ["payment-methods", "admin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
