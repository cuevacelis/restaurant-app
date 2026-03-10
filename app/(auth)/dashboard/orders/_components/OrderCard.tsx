"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  formatRelativeTime,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  getWaitTimeColor,
  formatWaitTime,
} from "@/lib/utils";
import type { Order } from "../services/useOrders";

interface Props {
  order: Order;
  onView: () => void;
  onVerify: () => void;
  onMarkDelivered: () => void;
  updating: boolean;
}

export function OrderCard({ order, onView, onVerify, onMarkDelivered, updating }: Props) {
  return (
    <Card className="hover:bg-muted/20 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium text-sm">{order.customer_name}</p>
              {order.order_type === "takeout" && (
                <Badge variant="outline" className="text-xs">Para llevar</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {order.table_number ? `Mesa #${order.table_number}` : "Para llevar"}
              {" · "}
              {formatRelativeTime(order.created_at)}
            </p>
            {!["completed", "cancelled", "paid"].includes(order.status) && (
              <p className={`text-xs font-medium mt-0.5 ${getWaitTimeColor(order.created_at)}`}>
                Espera: {formatWaitTime(order.created_at)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold">{formatCurrency(order.total_amount)}</span>
            <Badge className={`text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            {order.status === "pending_verification" && (
              <Button size="sm" variant="outline" onClick={onVerify} disabled={updating}
                className="border-orange-400 text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950">
                Verificar
              </Button>
            )}
            {order.status === "ready_to_deliver" && (
              <Button size="sm" onClick={onMarkDelivered} disabled={updating}>
                Entregar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
