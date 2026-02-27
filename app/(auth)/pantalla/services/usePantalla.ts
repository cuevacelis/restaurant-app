"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrders } from "@/app/(auth)/dashboard/orders/services/useOrders";
import { useWebSocket } from "@/hooks/useWebSocket";

export function usePantalla() {
  const qc = useQueryClient();

  const { data } = useOrders({});

  useWebSocket({
    role: "customer",
    onMessage: (msg) => {
      if (msg.type === "ORDER_UPDATE") {
        qc.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      (navigator.wakeLock as WakeLock)
        .request("screen")
        .then((wl) => {
          wakeLock = wl;
        })
        .catch(() => {});
    }
    return () => {
      wakeLock?.release();
    };
  }, []);

  const orders = data?.orders ?? [];
  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  );

  return { activeOrders };
}
