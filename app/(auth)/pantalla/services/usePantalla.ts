"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useWebSocket } from "@/hooks/useWebSocket";

export function usePantalla() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    ...trpc.orders.list.queryOptions(),
    refetchInterval: 15000,
  });

  useWebSocket({
    role: "customer",
    onMessage: (msg) => {
      if (msg.type === "ORDER_UPDATE") {
        queryClient.invalidateQueries(trpc.orders.list.pathFilter());
      }
    },
  });

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      (navigator.wakeLock as WakeLock)
        .request("screen")
        .then((wl) => { wakeLock = wl; })
        .catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, []);

  const orders = data?.orders ?? [];
  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status)
  );

  return { activeOrders };
}
