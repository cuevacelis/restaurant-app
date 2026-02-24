"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/db/queries/orders";
import type { SessionPayload } from "@/lib/auth";

export interface Order {
  id: string;
  table_id: string | null;
  table_number: number | null;
  customer_name: string;
  order_type: "dine_in" | "takeout";
  status: OrderStatus;
  notes: string | null;
  total_amount: string;
  rating: number | null;
  review_comment: string | null;
  delivered_by_user_id: string | null;
  delivered_by_name: string | null;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: string;
    menu_item_id: string;
    menu_item_name: string;
    quantity: number;
    unit_price: string;
    notes: string | null;
  }>;
}

// ── Fetchers ─────────────────────────────────────────────────

async function fetchOrders(params: { status?: string; tableId?: string }): Promise<{ orders: Order[] }> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.tableId) sp.set("tableId", params.tableId);
  const res = await fetch(`/api/orders?${sp.toString()}`);
  if (!res.ok) throw new Error("Error al cargar pedidos");
  return res.json();
}

async function fetchOrder(id: string): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("Error al cargar pedido");
  return res.json();
}

async function updateStatus(id: string, status: OrderStatus): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error al actualizar estado"); }
  return res.json();
}

async function changeTable(orderId: string, tableId: string | null): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${orderId}/table`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table_id: tableId }),
  });
  if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error al cambiar mesa"); }
  return res.json();
}

async function updateItems(
  orderId: string,
  items: Array<{ menu_item_id: string; quantity: number; unit_price: number }>
): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${orderId}/items`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error al actualizar ítems"); }
  return res.json();
}

async function fetchTables(): Promise<{ tables: Array<{ id: string; number: number; capacity: number }> }> {
  const res = await fetch("/api/tables");
  if (!res.ok) throw new Error("Error al cargar mesas");
  return res.json();
}

async function fetchMenuItems(): Promise<{ items: Array<{ id: string; name: string; price: string; category_name: string }> }> {
  const res = await fetch("/api/menu?availableOnly=true");
  if (!res.ok) throw new Error("Error al cargar menú");
  return res.json();
}

// ── Hooks ─────────────────────────────────────────────────────

export function useOrders(params: { status?: string; tableId?: string } = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders(params),
    refetchInterval: 15000,
  });
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<SessionPayload | null> => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      const d = await res.json();
      return d.user ?? null;
    },
    staleTime: Infinity,
  });
}

export function useTables() {
  return useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    staleTime: 30000,
  });
}

export function useMenuItems() {
  return useQuery({
    queryKey: ["menu", "all"],
    queryFn: fetchMenuItems,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      order_type: "dine_in" | "takeout";
      table_id?: string;
      notes?: string;
      items: Array<{ menu_item_id: string; quantity: number; unit_price: number }>;
    }) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al crear pedido");
      }
      return res.json() as Promise<{ order: Order }>;
    },
    onSuccess: () => {
      toast.success("Pedido creado");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMarkOrderPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => updateStatus(id, "paid"),
    onSuccess: () => {
      toast.success("Pedido marcado como pagado");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(status === "cancelled" ? "Pedido cancelado" : "Estado actualizado");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useChangeOrderTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, tableId }: { orderId: string; tableId: string | null }) =>
      changeTable(orderId, tableId),
    onSuccess: () => {
      toast.success("Mesa actualizada");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateOrderItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      items,
    }: {
      orderId: string;
      items: Array<{ menu_item_id: string; quantity: number; unit_price: number }>;
    }) => updateItems(orderId, items),
    onSuccess: () => {
      toast.success("Pedido actualizado");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
