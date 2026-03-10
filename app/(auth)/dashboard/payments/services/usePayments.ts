"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/routers/_app";

export type PaymentMethod = RouterOutputs["payments"]["listAdmin"]["methods"][number];

export function usePaymentMethods() {
  const trpc = useTRPC();
  return useQuery(trpc.payments.listAdmin.queryOptions());
}

export function useDeletePaymentMethod() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.payments.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Método desactivado");
        queryClient.invalidateQueries(trpc.payments.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}
