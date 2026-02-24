"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChefHat, Clock, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useKitchenOrders, useUpdateKitchenStatus } from "./services/useKitchen";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatWaitTime, getWaitTimeColor, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";
import { toast } from "sonner";

export default function KitchenPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useKitchenOrders();
  const { mutate: updateStatus, isPending } = useUpdateKitchenStatus();

  // Real-time WebSocket updates
  useWebSocket({
    role: "chef",
    onMessage: (msg) => {
      if (msg.type === "ORDER_UPDATE") {
        qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
        if (msg.data.status === "pending") {
          toast.info(`Nuevo pedido de ${msg.data.customer_name}`, {
            description: "Un nuevo pedido ha llegado a cocina",
          });
        }
      }
    },
  });

  const orders = data?.orders ?? [];
  const pending = orders.filter((o) => o.status === "pending");
  const inPrep = orders.filter((o) => o.status === "in_preparation");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900">
          <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cocina</h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} pendientes · {inPrep.length} en preparación
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <ChefHat className="mx-auto h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">Sin pedidos pendientes</p>
          <p className="text-sm mt-1">Los nuevos pedidos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={`border-2 ${
                order.status === "pending"
                  ? "border-yellow-300 dark:border-yellow-700"
                  : "border-blue-300 dark:border-blue-700"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{order.customer_name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.table_number ? `Mesa #${order.table_number}` : "Para llevar"}
                      {" · "}
                      {order.order_type === "takeout" ? "Llevar" : "Local"}
                    </p>
                  </div>
                  <Badge className={ORDER_STATUS_COLORS[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${getWaitTimeColor(order.created_at)}`}>
                  <Clock className="h-3 w-3" />
                  {formatWaitTime(order.created_at)}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Items */}
                <div className="space-y-1">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        <span className="text-primary mr-1">{item.quantity}×</span>
                        {item.menu_item_name}
                      </span>
                      {item.notes && (
                        <span className="text-xs text-muted-foreground italic">
                          {item.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                    📝 {order.notes}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateStatus({ id: order.id, status: "in_preparation" })}
                      disabled={isPending}
                    >
                      <ChefHat className="h-3 w-3 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  {order.status === "in_preparation" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400"
                      onClick={() => updateStatus({ id: order.id, status: "ready_to_deliver" })}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Listo para entregar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
