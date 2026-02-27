"use client";

import { ChefHat, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWaitTime, getWaitTimeColor, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/lib/db/queries/orders";
import type { KitchenOrder } from "./_types";

interface Props {
  order: KitchenOrder;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  isPending: boolean;
}

export function KitchenOrderCard({ order, onUpdateStatus, isPending }: Props) {
  return (
    <Card
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
        <div className="space-y-1">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">
                <span className="text-primary mr-1">{item.quantity}×</span>
                {item.menu_item_name}
              </span>
              {item.notes && (
                <span className="text-xs text-muted-foreground italic">{item.notes}</span>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
            📝 {order.notes}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {order.status === "pending" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onUpdateStatus(order.id, "in_preparation")}
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
              onClick={() => onUpdateStatus(order.id, "ready_to_deliver")}
              disabled={isPending}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Listo para entregar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
