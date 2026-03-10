"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

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

export function useMenu() {
  const trpc = useTRPC();
  return useQuery(
    trpc.menu.listItems.queryOptions({ availableOnly: true })
  );
}
