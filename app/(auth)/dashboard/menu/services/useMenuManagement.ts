"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  category_name: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  available: boolean;
}

async function fetchMenu(): Promise<{ items: MenuItem[]; categories: Category[] }> {
  const res = await fetch("/api/menu?availableOnly=false");
  if (!res.ok) throw new Error("Error al cargar menú");
  return res.json();
}

async function createItem(data: Partial<MenuItem>) {
  const res = await fetch("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error || "Error al crear ítem");
  }
  return res.json();
}

async function updateItem(id: string, data: Partial<MenuItem>) {
  const res = await fetch(`/api/menu/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error || "Error al actualizar ítem");
  }
  return res.json();
}

async function deleteItem(id: string) {
  const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar ítem");
}

async function createCategory(data: Partial<Category>) {
  const res = await fetch("/api/menu/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error || "Error al crear categoría");
  }
  return res.json();
}

export function useMenuManagement() {
  return useQuery({
    queryKey: ["menu", "management"],
    queryFn: fetchMenu,
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      toast.success("Ítem creado");
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      updateItem(id, data),
    onSuccess: () => {
      toast.success("Ítem actualizado");
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      toast.success("Ítem eliminado");
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success("Categoría creada");
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
