"use client";

import { useQuery } from "@tanstack/react-query";

export interface MenuItem {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

export interface MenuData {
  items: MenuItem[];
  categories: Category[];
}

async function fetchMenu(): Promise<MenuData> {
  const res = await fetch("/api/menu?availableOnly=true");
  if (!res.ok) throw new Error("Error al cargar el menú");
  return res.json();
}

export function useMenu() {
  return useQuery({
    queryKey: ["menu", "public"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
