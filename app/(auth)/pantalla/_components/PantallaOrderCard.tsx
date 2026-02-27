import { Clock } from "lucide-react";
import { formatWaitTime } from "@/lib/utils";
import type { Order } from "@/app/(auth)/dashboard/orders/services/useOrders";
import type { Column } from "./_types";

interface Props {
  order: Order;
  col: Column;
}

export function PantallaOrderCard({ order, col }: Props) {
  return (
    <div className="rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-black tracking-tight leading-none">
            #{order.id.slice(0, 6).toUpperCase()}
          </p>
          <p className="text-base font-semibold mt-1">{order.customer_name}</p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${col.badgeBg} ${col.badgeText}`}
        >
          {order.order_type === "takeout"
            ? "Para llevar"
            : `Mesa #${order.table_number ?? "?"}`}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        <Clock className="inline h-3.5 w-3.5 mr-1" />
        {formatWaitTime(order.created_at)}
      </p>

      {order.items && order.items.length > 0 ? (
        <div className="mt-2 space-y-0.5">
          {order.items.slice(0, 3).map((item) => (
            <p key={item.id} className="text-xs text-muted-foreground truncate">
              {item.quantity}× {item.menu_item_name}
            </p>
          ))}
          {order.items.length > 3 ? (
            <p className="text-xs text-muted-foreground">
              +{order.items.length - 3} más...
            </p>
          ) : null}
        </div>
      ) : null}

      {order.status === "ready_to_deliver" ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            ¡Pasa a recoger tu pedido!
          </p>
        </div>
      ) : null}
    </div>
  );
}
