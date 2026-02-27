import type { Order } from "@/app/(auth)/dashboard/orders/services/useOrders";
import type { Column } from "./_types";
import { PantallaOrderCard } from "./PantallaOrderCard";

interface Props {
  col: Column;
  orders: Order[];
}

export function PantallaColumn({ col, orders }: Props) {
  const Icon = col.icon;

  return (
    <div
      className={`rounded-2xl border-2 ${col.border} ${col.bg} flex flex-col overflow-hidden`}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-inherit">
        <Icon className={`h-6 w-6 ${col.iconColor}`} />
        <div>
          <p className="font-bold text-lg leading-none">{col.label}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground opacity-50">
            <Icon className="mx-auto h-10 w-10 mb-2" />
            <p className="text-sm">Sin pedidos</p>
          </div>
        ) : (
          orders.map((order) => (
            <PantallaOrderCard key={order.id} order={order} col={col} />
          ))
        )}
      </div>
    </div>
  );
}
