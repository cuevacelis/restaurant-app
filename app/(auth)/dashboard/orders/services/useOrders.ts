"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useSession as useAuthSession } from "@/lib/auth-client";
import type { RouterOutputs } from "@/trpc/routers/_app";

export type Order = RouterOutputs["orders"]["list"]["orders"][number];
export type OrderDetail = RouterOutputs["orders"]["getById"]["order"];
export type { OrderStatus } from "@/lib/db/order-status";

/** Wraps Better Auth session with a compatible interface for existing components */
export function useSession() {
  const { data, isPending, error } = useAuthSession();
  return {
    isPending,
    error,
    data: data?.user
      ? {
          userId: data.user.id,
          username: (data.user as Record<string, unknown>).username as string ?? "",
          role: (data.user as Record<string, unknown>).role as "admin" | "waiter" | "chef",
          name: data.user.name,
        }
      : null,
  };
}

export function useCurrentSession() {
  return useAuthSession();
}

export function useOrders(params: { status?: string; tableId?: string } = {}) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.orders.list.queryOptions(
      Object.keys(params).length ? params : undefined
    ),
    refetchInterval: 15000,
  });
}

export function useOrderDetail(id: string) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.orders.getById.queryOptions({ id }),
    enabled: !!id,
  });
}

export function useTables() {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.tables.list.queryOptions(),
    staleTime: 30000,
  });
}

export function useMenuItems() {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.menu.listItems.queryOptions({ availableOnly: true }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrder() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.orders.create.mutationOptions({
      onSuccess: () => {
        toast.success("Pedido creado");
        queryClient.invalidateQueries(trpc.orders.list.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useMarkOrderPaid() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.orders.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Pedido marcado como pagado");
        queryClient.invalidateQueries(trpc.orders.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useUpdateOrderStatus() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.orders.updateStatus.mutationOptions({
      onSuccess: (_, vars) => {
        toast.success(vars.status === "cancelled" ? "Pedido cancelado" : "Estado actualizado");
        queryClient.invalidateQueries(trpc.orders.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useChangeOrderTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.orders.changeTable.mutationOptions({
      onSuccess: () => {
        toast.success("Mesa actualizada");
        queryClient.invalidateQueries(trpc.orders.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useUpdateOrderItems() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.orders.replaceItems.mutationOptions({
      onSuccess: () => {
        toast.success("Pedido actualizado");
        queryClient.invalidateQueries(trpc.orders.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}
