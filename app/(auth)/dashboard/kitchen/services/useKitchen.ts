"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import type { KitchenOrder } from "../_components/_types";
export type { KitchenOrder } from "../_components/_types";

export function useKitchenOrders() {
  const trpc = useTRPC();

  const pending = useQuery({
    ...trpc.orders.list.queryOptions({ status: "pending" }),
    refetchInterval: 15000,
  });
  const inPrep = useQuery({
    ...trpc.orders.list.queryOptions({ status: "in_preparation" }),
    refetchInterval: 15000,
  });

  const orders: KitchenOrder[] = [
    ...(pending.data?.orders ?? []),
    ...(inPrep.data?.orders ?? []),
  ] as KitchenOrder[];

  return {
    data: { orders },
    isLoading: pending.isLoading || inPrep.isLoading,
    error: pending.error ?? inPrep.error,
  };
}

export function useKitchenOrderDetail(id: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.orders.getById.queryOptions({ id: id! }),
    enabled: !!id,
  });
}

export function useUpdateKitchenStatus() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.orders.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Pedido actualizado");
        queryClient.invalidateQueries(trpc.orders.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}
