"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/routers/_app";

export type Order = RouterOutputs["orders"]["getById"]["order"];

export interface OrderItem {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  name: string; // for display only
}

export interface CreateOrderPayload {
  table_id?: string;
  customer_name: string;
  order_type: "dine_in" | "takeout";
  notes?: string;
  items: Omit<OrderItem, "name">[];
}

export function useCreateOrder() {
  const trpc = useTRPC();
  return useMutation({
    ...trpc.orders.create.mutationOptions({
      onSuccess: () => toast.success("¡Pedido enviado! Estamos preparando tu orden."),
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useOrder(orderId: string | null, enabled = true) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.orders.getById.queryOptions({ id: orderId! }),
    enabled: !!orderId && enabled,
    refetchInterval: 10000,
  });
}

export function useAddOrderItems(orderId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    trpc.orders.appendItems.mutationOptions({
      onSuccess: () => {
        toast.success("¡Ítems agregados a tu pedido!");
        queryClient.invalidateQueries({ queryKey: trpc.orders.getById.queryKey({ id: orderId }) });
      },
      onError: (err) => toast.error(err.message),
    })
  );
  type AppendItems = Array<{ menu_item_id: string; quantity: number; unit_price: number; notes?: string }>;
  type MutOpts = Parameters<typeof mutation.mutate>[1];
  return {
    ...mutation,
    mutate: (items: AppendItems, opts?: MutOpts) =>
      mutation.mutate({ orderId, items }, opts),
    mutateAsync: (items: AppendItems, opts?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ orderId, items }, opts),
  };
}

export function useSubmitReview(orderId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    trpc.orders.submitReview.mutationOptions({
      onSuccess: () => {
        toast.success("¡Gracias por tu calificación!");
        queryClient.invalidateQueries({ queryKey: trpc.orders.getById.queryKey({ id: orderId }) });
      },
      onError: (err) => toast.error(err.message),
    })
  );
  type ReviewInput = { rating: number; comment?: string };
  type MutOpts = Parameters<typeof mutation.mutate>[1];
  return {
    ...mutation,
    mutate: (input: ReviewInput, opts?: MutOpts) =>
      mutation.mutate({ orderId, ...input }, opts),
    mutateAsync: (input: ReviewInput, opts?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ orderId, ...input }, opts),
  };
}
