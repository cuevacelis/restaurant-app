"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type MenuData = RouterOutputs["menu"]["listItems"];
export type MenuItem = MenuData["items"][number];
export type Category = MenuData["categories"][number];

export function useMenu() {
  const trpc = useTRPC();
  return useQuery(
    trpc.menu.listItems.queryOptions({ availableOnly: true })
  );
}
