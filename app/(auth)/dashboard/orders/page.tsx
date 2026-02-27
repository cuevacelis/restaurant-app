"use client";

import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrders, useUpdateOrderStatus, useSession } from "./services/useOrders";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { useOrderFilters } from "./_hooks/useOrderFilters";
import { OrderFilters } from "./_components/OrderFilters";
import { OrderCard } from "./_components/OrderCard";
import { OrderDetailDialog } from "./_components/order-detail/OrderDetailDialog";
import { CreateOrderDialog } from "./_components/create-order/CreateOrderDialog";
import type { Order } from "./services/useOrders";

export default function OrdersPage() {
  const qc = useQueryClient();
  const { status, tableId, selectedOrderId, setParam } = useOrderFilters();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useOrders({ status: status || undefined, tableId: tableId || undefined });
  const { mutate: updateStatus, isPending: updating } = useUpdateOrderStatus();
  const { data: sessionData } = useSession();
  const isAdmin = sessionData?.role === "admin";

  useWebSocket({
    role: "waiter",
    onMessage: (msg) => {
      if (msg.type === "ORDER_UPDATE") {
        qc.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });

  const orders = data?.orders ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo pedido
          </Button>
        )}
      </div>

      <OrderFilters status={status} onStatusChange={(s) => setParam("status", s)} />

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <CheckCircle2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p>No hay pedidos para mostrar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order: Order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => setParam("orderId", order.id)}
              onMarkDelivered={() => updateStatus({ id: order.id, status: "completed" })}
              updating={updating}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setParam("orderId", null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
          </DialogHeader>
          {selectedOrderId ? (
            <OrderDetailDialog
              orderId={selectedOrderId}
              onClose={() => setParam("orderId", null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pedido</DialogTitle>
          </DialogHeader>
          {createOpen ? <CreateOrderDialog onClose={() => setCreateOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
