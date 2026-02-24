"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/db/queries/orders";

export interface KitchenOrder {
  id: string;
  table_id: string | null;
  table_number: number | null;
  customer_name: string;
  order_type: "dine_in" | "takeout";
  status: OrderStatus;
  notes: string | null;
  total_amount: string;
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

async function fetchKitchenOrders(): Promise<{ orders: KitchenOrder[] }> {
  const res = await fetch("/api/orders?status=pending");
  if (!res.ok) throw new Error("Error al cargar pedidos");
  const data = await res.json();

  // Also fetch in_preparation
  const res2 = await fetch("/api/orders?status=in_preparation");
  const data2 = await res2.json();

  return { orders: [...data.orders, ...data2.orders] };
}

async function fetchOrderDetail(id: string): Promise<{ order: KitchenOrder }> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("Error al cargar pedido");
  return res.json();
}

async function updateStatus(id: string, status: OrderStatus) {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error || "Error al actualizar estado");
  }
  return res.json();
}

export function useKitchenOrders() {
  return useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: fetchKitchenOrders,
    refetchInterval: 15000,
  });
}

export function useKitchenOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ["kitchen-order", id],
    queryFn: () => fetchOrderDetail(id!),
    enabled: !!id,
  });
}

export function useUpdateKitchenStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateStatus(id, status),
    onSuccess: () => {
      toast.success("Pedido actualizado");
      qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
