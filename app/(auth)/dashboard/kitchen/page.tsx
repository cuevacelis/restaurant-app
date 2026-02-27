"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChefHat, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useKitchenOrders, useUpdateKitchenStatus } from "./services/useKitchen";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import { KitchenOrderCard } from "./_components/KitchenOrderCard";

export default function KitchenPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useKitchenOrders();
  const { mutate: updateStatus, isPending } = useUpdateKitchenStatus();

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
            <KitchenOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={(id, status) => updateStatus({ id, status })}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
