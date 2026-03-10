"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/routers/_app";

export type Table = RouterOutputs["tables"]["list"]["tables"][number];
export type { TableWithOrders } from "../_components/_types";

export function useTables() {
  const trpc = useTRPC();
  return useQuery(trpc.tables.list.queryOptions());
}

export function useTableOrders(tableId: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.tables.ordersByTable.queryOptions({ tableId: tableId! }),
    enabled: !!tableId,
  });
}

export function useCreateTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.tables.create.mutationOptions({
      onSuccess: () => {
        toast.success("Mesa creada");
        queryClient.invalidateQueries(trpc.tables.list.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useDeleteTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.tables.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Mesa eliminada");
        queryClient.invalidateQueries(trpc.tables.list.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}
