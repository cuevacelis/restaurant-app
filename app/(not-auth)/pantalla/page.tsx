"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChefHat, Clock, PackageCheck, Utensils } from "lucide-react";
import { useOrders } from "@/app/(auth)/dashboard/orders/services/useOrders";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatWaitTime, ORDER_STATUS_LABELS } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const COLUMNS = [
  {
    status: "pending",
    label: "Recibido",
    icon: Clock,
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    badgeBg: "bg-yellow-100 dark:bg-yellow-900",
    badgeText: "text-yellow-800 dark:text-yellow-200",
  },
  {
    status: "in_preparation",
    label: "En preparación",
    icon: ChefHat,
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900",
    badgeText: "text-blue-800 dark:text-blue-200",
  },
  {
    status: "ready_to_deliver",
    label: "¡Listo para recoger!",
    icon: PackageCheck,
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    badgeBg: "bg-green-100 dark:bg-green-900",
    badgeText: "text-green-800 dark:text-green-200",
  },
] as const;

export default function PantallaPage() {
  const qc = useQueryClient();

  // Fetch all active orders (no status filter = all)
  const { data } = useOrders({});

  // WebSocket for real-time updates
  useWebSocket({
    role: "customer",
    onMessage: (msg) => {
      if (msg.type === "ORDER_UPDATE") {
        qc.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });

  // Keep screen awake (wake lock API if supported)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      (navigator.wakeLock as WakeLock).request("screen").then((wl) => { wakeLock = wl; }).catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, []);

  const orders = data?.orders ?? [];
  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Estado de pedidos</h1>
            <p className="text-sm text-muted-foreground">{activeOrders.length} pedido{activeOrders.length !== 1 ? "s" : ""} activo{activeOrders.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Columns */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-6">
        {COLUMNS.map((col) => {
          const colOrders = activeOrders.filter((o) => o.status === col.status);
          const Icon = col.icon;

          return (
            <div key={col.status} className={`rounded-2xl border-2 ${col.border} ${col.bg} flex flex-col overflow-hidden`}>
              {/* Column header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-inherit">
                <Icon className={`h-6 w-6 ${col.iconColor}`} />
                <div>
                  <p className="font-bold text-lg leading-none">{col.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {colOrders.length} pedido{colOrders.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Order cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {colOrders.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground opacity-50">
                    <Icon className="mx-auto h-10 w-10 mb-2" />
                    <p className="text-sm">Sin pedidos</p>
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 p-4 shadow-sm"
                    >
                      {/* Order number + name */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-2xl font-black tracking-tight leading-none">
                            #{order.id.slice(0, 6).toUpperCase()}
                          </p>
                          <p className="text-base font-semibold mt-1">{order.customer_name}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                          {order.order_type === "takeout" ? "Para llevar" : `Mesa #${order.table_number ?? "?"}`}
                        </span>
                      </div>

                      {/* Wait time */}
                      <p className="mt-2 text-sm text-muted-foreground">
                        <Clock className="inline h-3.5 w-3.5 mr-1" />
                        {formatWaitTime(order.created_at)}
                      </p>

                      {/* Items summary */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {order.items.slice(0, 3).map((item) => (
                            <p key={item.id} className="text-xs text-muted-foreground truncate">
                              {item.quantity}× {item.menu_item_name}
                            </p>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{order.items.length - 3} más...
                            </p>
                          )}
                        </div>
                      )}

                      {/* Ready to deliver pulse animation */}
                      {order.status === "ready_to_deliver" && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                          </span>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ¡Pasa a recoger tu pedido!
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 border-t text-center text-xs text-muted-foreground">
        Actualización en tiempo real · {new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
      </footer>
    </div>
  );
}
