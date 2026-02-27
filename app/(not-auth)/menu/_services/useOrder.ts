"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export interface Order {
  id: string;
  table_id: string | null;
  table_number?: number | null;
  customer_name: string;
  order_type: "dine_in" | "takeout";
  status: "pending" | "in_preparation" | "ready_to_deliver" | "completed" | "cancelled" | "paid";
  notes: string | null;
  total_amount: string;
  rating: number | null;
  review_comment: string | null;
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

async function createOrderFn(payload: CreateOrderPayload): Promise<{ order: Order }> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al crear pedido");
  }
  return res.json();
}

async function fetchOrder(id: string): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("Error al cargar pedido");
  return res.json();
}

async function submitReview(orderId: string, rating: number, comment?: string) {
  const res = await fetch(`/api/orders/${orderId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al enviar reseña");
  }
  return res.json();
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrderFn,
    onSuccess: () => {
      toast.success("¡Pedido enviado! Estamos preparando tu orden.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useOrder(orderId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId && enabled,
    refetchInterval: 10000, // poll every 10s as fallback
  });
}

export function useAddOrderItems(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Omit<OrderItem, "name">[]) => {
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al agregar ítems");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("¡Ítems agregados a tu pedido!");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmitReview(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      submitReview(orderId, rating, comment),
    onSuccess: () => {
      toast.success("¡Gracias por tu calificación!");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
