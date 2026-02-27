"use client";

import { useState } from "react";
import { CheckCircle2, Star, Plus, Minus, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  useOrderDetail,
  useSession,
  useTables,
  useMenuItems,
  useUpdateOrderStatus,
  useChangeOrderTable,
  useUpdateOrderItems,
  useMarkOrderPaid,
} from "../../services/useOrders";
import { formatCurrency, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";
import { upsertDraftItem, updateDraftQty } from "../../_lib/draft-items";
import type { DraftItem } from "../_types";
import type { OrderStatus } from "@/lib/db/queries/orders";

interface Props {
  orderId: string;
  onClose: () => void;
}

export function OrderDetailDialog({ orderId, onClose }: Props) {
  const { data: detailData, isLoading } = useOrderDetail(orderId);
  const { data: sessionData } = useSession();
  const { data: tablesData } = useTables();
  const { data: menuData } = useMenuItems();
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateOrderStatus();
  const { mutate: changeTable, isPending: changingTable } = useChangeOrderTable();
  const { mutate: updateItems, isPending: updatingItems } = useUpdateOrderItems();
  const { mutate: markPaid, isPending: markingPaid } = useMarkOrderPaid();

  const [editingItems, setEditingItems] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [newItemId, setNewItemId] = useState("");

  const role = sessionData?.role;
  const canEdit = role === "admin" || role === "waiter";
  const order = detailData?.order;
  const tables = tablesData?.tables ?? [];
  const menuItems = menuData?.items ?? [];

  const isEditable = order && !["completed", "cancelled", "paid"].includes(order.status);

  const startEditing = () => {
    if (!order?.items) return;
    setDraftItems(
      order.items.map((i) => ({
        id: i.id,
        menu_item_id: i.menu_item_id,
        menu_item_name: i.menu_item_name,
        quantity: i.quantity,
        unit_price: parseFloat(i.unit_price),
      }))
    );
    setNewItemId("");
    setEditingItems(true);
  };

  const cancelEditing = () => {
    setEditingItems(false);
    setDraftItems([]);
    setNewItemId("");
  };

  const addNewItem = () => {
    if (!newItemId) return;
    const menuItem = menuItems.find((m) => m.id === newItemId);
    if (!menuItem) return;
    setDraftItems((prev) => upsertDraftItem(prev, menuItem));
    setNewItemId("");
  };

  const saveItems = () => {
    if (!order || !draftItems.length) return;
    updateItems(
      {
        orderId: order.id,
        items: draftItems.map((d) => ({
          menu_item_id: d.menu_item_id,
          quantity: d.quantity,
          unit_price: d.unit_price,
        })),
      },
      { onSuccess: () => setEditingItems(false) }
    );
  };

  const draftTotal = draftItems.reduce((s, d) => s + d.unit_price * d.quantity, 0);

  if (isLoading || !order) {
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Cliente</p>
          <p className="font-medium">{order.customer_name}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-xs">Mesa</p>
          {canEdit && isEditable ? (
            <select
              className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              defaultValue={order.table_id ?? ""}
              disabled={changingTable}
              onChange={(e) =>
                changeTable({ orderId: order.id, tableId: e.target.value || null })
              }
            >
              <option value="">Para llevar</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa #{t.number} ({t.capacity}p)
                </option>
              ))}
            </select>
          ) : (
            <p className="font-medium">
              {order.table_number ? `#${order.table_number}` : "Para llevar"}
            </p>
          )}
        </div>

        <div>
          <p className="text-muted-foreground text-xs">Tipo</p>
          <p className="font-medium">{order.order_type === "dine_in" ? "Comer aquí" : "Para llevar"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Estado</p>
          <Badge className={ORDER_STATUS_COLORS[order.status]}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Ítems del pedido</p>
          {canEdit && isEditable && !editingItems && (
            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={startEditing}>
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          )}
        </div>

        {editingItems ? (
          <div className="space-y-2">
            {draftItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => setDraftItems((prev) => updateDraftQty(prev, idx, -1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center font-medium">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => setDraftItems((prev) => updateDraftQty(prev, idx, 1))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="flex-1">{item.menu_item_name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatCurrency(item.unit_price * item.quantity)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  onClick={() => setDraftItems((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <select
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                value={newItemId}
                onChange={(e) => setNewItemId(e.target.value)}
              >
                <option value="">Agregar ítem...</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {formatCurrency(m.price)}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={addNewItem} disabled={!newItemId}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <Separator />
            <div className="flex justify-between font-semibold text-sm">
              <span>Total estimado</span>
              <span>{formatCurrency(draftTotal)}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={cancelEditing}>
                <X className="h-3 w-3 mr-1" />
                Descartar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={saveItems}
                disabled={updatingItems || !draftItems.length}
              >
                {updatingItems ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}× {item.menu_item_name}</span>
                <span>{formatCurrency(parseFloat(item.unit_price) * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-sm">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        )}
      </div>

      {order.notes && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium mb-1">Notas</p>
          <p className="text-muted-foreground">{order.notes}</p>
        </div>
      )}

      {order.delivered_by_name && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="text-muted-foreground text-xs">Entregado por</p>
          <p className="font-medium">{order.delivered_by_name}</p>
        </div>
      )}

      {order.rating && (
        <div className="rounded-lg bg-muted p-3 text-sm space-y-1.5">
          <p className="font-medium">Calificación del cliente</p>
          <div className="flex gap-0.5 items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= order.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                }`}
              />
            ))}
            <span className="ml-1 text-muted-foreground">{order.rating}/5</span>
          </div>
          {order.review_comment && (
            <p className="text-muted-foreground italic">"{order.review_comment}"</p>
          )}
        </div>
      )}

      {!editingItems && (
        <div className="flex gap-2 pt-1">
          {canEdit && isEditable && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() =>
                updateStatus(
                  { id: order.id, status: "cancelled" as OrderStatus },
                  { onSuccess: onClose }
                )
              }
              disabled={updatingStatus}
            >
              Cancelar pedido
            </Button>
          )}
          {order.status === "ready_to_deliver" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() =>
                updateStatus({ id: order.id, status: "completed" }, { onSuccess: onClose })
              }
              disabled={updatingStatus}
            >
              {updatingStatus ? "..." : "Marcar entregado"}
            </Button>
          )}
          {order.status === "completed" && canEdit && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => markPaid({ id: order.id }, { onSuccess: onClose })}
              disabled={markingPaid}
            >
              {markingPaid ? "..." : "Marcar como pagado"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
