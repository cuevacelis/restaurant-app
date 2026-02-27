"use client";

import { UtensilsCrossed, Clock, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWaitTimeColor, formatWaitTime } from "@/lib/utils";
import type { Table } from "./_types";
import type { Order } from "../../orders/services/useOrders";

interface Props {
  table: Table;
  activeOrders: Order[];
  isSelected: boolean;
  onSelect: () => void;
  onOpenQr: () => void;
}

export function TableCard({ table, activeOrders, isSelected, onSelect, onOpenQr }: Props) {
  const hasOrders = activeOrders.length > 0;
  const oldest = hasOrders
    ? activeOrders.reduce((a, b) => (a.created_at < b.created_at ? a : b))
    : null;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${hasOrders ? "border-orange-300 dark:border-orange-700" : ""}`}
      onClick={onSelect}
    >
      <CardContent className="p-3 text-center space-y-1">
        <div
          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
            hasOrders ? "bg-orange-100 dark:bg-orange-900" : "bg-muted"
          }`}
        >
          <UtensilsCrossed
            className={`h-5 w-5 ${
              hasOrders ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
            }`}
          />
        </div>
        <p className="font-bold text-lg leading-none">#{table.number}</p>
        <p className="text-xs text-muted-foreground">{table.capacity} personas</p>
        {hasOrders && oldest && (
          <p className={`text-xs font-medium ${getWaitTimeColor(oldest.created_at)}`}>
            <Clock className="inline h-3 w-3 mr-0.5" />
            {formatWaitTime(oldest.created_at)}
          </p>
        )}
        {hasOrders && (
          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-400">
            {activeOrders.length} pedido{activeOrders.length > 1 ? "s" : ""}
          </Badge>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenQr();
          }}
          className="mt-1 flex items-center justify-center gap-1 w-full rounded-md py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <QrCode className="h-3 w-3" />
          Ver QR
        </button>
      </CardContent>
    </Card>
  );
}
