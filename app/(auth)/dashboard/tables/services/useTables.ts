"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Table {
  id: string;
  number: number;
  capacity: number;
  active: boolean;
  created_at: string;
}

export interface TableWithOrders extends Table {
  order_count: number;
  oldest_order: string | null;
}

async function fetchTables(): Promise<{ tables: Table[] }> {
  const res = await fetch("/api/tables");
  if (!res.ok) throw new Error("Error al cargar mesas");
  return res.json();
}

async function fetchOrdersByTable(tableId: string) {
  const res = await fetch(`/api/orders?tableId=${tableId}`);
  if (!res.ok) throw new Error("Error al cargar pedidos");
  return res.json();
}

async function createTable(data: { number: number; capacity: number }) {
  const res = await fetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error || "Error al crear mesa");
  }
  return res.json();
}

async function deleteTable(id: string) {
  const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar mesa");
}

export function useTables() {
  return useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
  });
}

export function useTableOrders(tableId: string | null) {
  return useQuery({
    queryKey: ["table-orders", tableId],
    queryFn: () => fetchOrdersByTable(tableId!),
    enabled: !!tableId,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      toast.success("Mesa creada");
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      toast.success("Mesa eliminada");
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
