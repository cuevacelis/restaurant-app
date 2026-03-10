"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/routers/_app";

export type User = RouterOutputs["users"]["list"]["users"][number];

export function useUsers() {
  const trpc = useTRPC();
  return useQuery(trpc.users.list.queryOptions());
}

export function useCreateUser() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.users.create.mutationOptions({
      onSuccess: () => {
        toast.success("Usuario creado correctamente");
        queryClient.invalidateQueries(trpc.users.list.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useUpdateUser() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.users.update.mutationOptions({
      onSuccess: () => {
        toast.success("Usuario actualizado");
        queryClient.invalidateQueries(trpc.users.list.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}

export function useDeleteUser() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.users.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Usuario desactivado");
        queryClient.invalidateQueries(trpc.users.list.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  });
}
