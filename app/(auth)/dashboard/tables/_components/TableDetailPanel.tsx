"use client";

import { QrCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, getWaitTimeColor, formatWaitTime } from "@/lib/utils";
import type { Table } from "./_types";
import type { Order } from "../../orders/services/useOrders";

interface Props {
  table: Table;
  orders: Order[];
  qrUrl: string;
  onOpenQr: () => void;
  onDelete: () => void;
}

export function TableDetailPanel({ table, orders, qrUrl, onOpenQr, onDelete }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Mesa #{table.number}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onOpenQr}>
              <QrCode className="h-4 w-4 mr-1" />
              Ver QR
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin pedidos activos en esta mesa
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  {!["completed", "cancelled", "paid"].includes(order.status) ? (
                    <p className={`text-xs ${getWaitTimeColor(order.created_at)}`}>
                      {formatWaitTime(order.created_at)}
                    </p>
                  ) : null}
                </div>
                <Badge className={ORDER_STATUS_COLORS[order.status]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground break-all">{qrUrl}</p>
      </CardContent>
    </Card>
  );
}
