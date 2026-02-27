"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { CheckCircle2, Eye, Star, Plus, Minus, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useOrders, useOrderDetail, useUpdateOrderStatus,
  useChangeOrderTable, useUpdateOrderItems,
  useCreateOrder, useMarkOrderPaid,
  useSession, useTables, useMenuItems,
  type Order,
} from "./services/useOrders";
import {
  formatCurrency, formatRelativeTime, ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS, getWaitTimeColor, formatWaitTime,
} from "@/lib/utils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@/lib/db/queries/orders";

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "in_preparation", label: "En preparación" },
  { value: "ready_to_deliver", label: "Listos" },
  { value: "completed", label: "Entregados" },
  { value: "paid", label: "Pagados" },
  { value: "cancelled", label: "Cancelados" },
];

// ── Draft item type used in the edit items UI ─────────────────
interface DraftItem {
  id?: string;          // existing item id (if any)
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
}

// ── Order detail dialog ───────────────────────────────────────
function OrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
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

  const updateDraftQty = (idx: number, delta: number) => {
    setDraftItems((prev) =>
      prev
        .map((item, i) => (i === idx ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeDraftItem = (idx: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addNewItem = () => {
    if (!newItemId) return;
    const menuItem = menuItems.find((m) => m.id === newItemId);
    if (!menuItem) return;
    const existing = draftItems.findIndex((d) => d.menu_item_id === newItemId);
    if (existing >= 0) {
      setDraftItems((prev) =>
        prev.map((d, i) => (i === existing ? { ...d, quantity: d.quantity + 1 } : d))
      );
    } else {
      setDraftItems((prev) => [
        ...prev,
        {
          menu_item_id: menuItem.id,
          menu_item_name: menuItem.name,
          quantity: 1,
          unit_price: parseFloat(menuItem.price),
        },
      ]);
    }
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
      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Cliente</p>
          <p className="font-medium">{order.customer_name}</p>
        </div>

        {/* Table — with reassign select for waiter/admin */}
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

      {/* Items section */}
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
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateDraftQty(idx, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center font-medium">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateDraftQty(idx, 1)}>
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
                  onClick={() => removeDraftItem(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Add new item row */}
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

      {/* Notes */}
      {order.notes && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium mb-1">Notas</p>
          <p className="text-muted-foreground">{order.notes}</p>
        </div>
      )}

      {/* Delivered by */}
      {order.delivered_by_name && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="text-muted-foreground text-xs">Entregado por</p>
          <p className="font-medium">{order.delivered_by_name}</p>
        </div>
      )}

      {/* Rating */}
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

      {/* Action buttons */}
      {!editingItems && (
        <div className="flex gap-2 pt-1">
          {canEdit && isEditable && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => updateStatus({ id: order.id, status: "cancelled" as OrderStatus }, { onSuccess: onClose })}
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

// ── Create order dialog (admin) ───────────────────────────────
function CreateOrderDialog({ onClose }: { onClose: () => void }) {
  const { data: tablesData } = useTables();
  const { data: menuData } = useMenuItems();
  const { mutate: createOrder, isPending } = useCreateOrder();

  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState<"dine_in" | "takeout">("dine_in");
  const [tableId, setTableId] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [newItemId, setNewItemId] = useState("");

  const tables = tablesData?.tables ?? [];
  const menuItems = menuData?.items ?? [];

  const addItem = () => {
    if (!newItemId) return;
    const menuItem = menuItems.find((m) => m.id === newItemId);
    if (!menuItem) return;
    const existing = draftItems.findIndex((d) => d.menu_item_id === newItemId);
    if (existing >= 0) {
      setDraftItems((prev) => prev.map((d, i) => (i === existing ? { ...d, quantity: d.quantity + 1 } : d)));
    } else {
      setDraftItems((prev) => [
        ...prev,
        { menu_item_id: menuItem.id, menu_item_name: menuItem.name, quantity: 1, unit_price: parseFloat(menuItem.price) },
      ]);
    }
    setNewItemId("");
  };

  const updateQty = (idx: number, delta: number) => {
    setDraftItems((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, quantity: d.quantity + delta } : d)).filter((d) => d.quantity > 0)
    );
  };

  const total = draftItems.reduce((s, d) => s + d.unit_price * d.quantity, 0);
  const canSubmit = customerName.trim() && draftItems.length > 0;

  const handleSubmit = () => {
    createOrder(
      {
        customer_name: customerName.trim(),
        order_type: orderType,
        table_id: orderType === "dine_in" && tableId ? tableId : undefined,
        notes: notes || undefined,
        items: draftItems.map((d) => ({ menu_item_id: d.menu_item_id, quantity: d.quantity, unit_price: d.unit_price })),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Nombre del cliente</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ej. Juan García"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "dine_in" | "takeout")}
          >
            <option value="dine_in">Comer aquí</option>
            <option value="takeout">Para llevar</option>
          </select>
        </div>
      </div>

      {orderType === "dine_in" && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Mesa</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
          >
            <option value="">Sin mesa asignada</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Mesa #{t.number} ({t.capacity}p)
              </option>
            ))}
          </select>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Ítems</p>
        {draftItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(idx, -1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-5 text-center font-medium">{item.quantity}</span>
              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(idx, 1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <span className="flex-1">{item.menu_item_name}</span>
            <span className="shrink-0 text-muted-foreground">{formatCurrency(item.unit_price * item.quantity)}</span>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDraftItems((p) => p.filter((_, i) => i !== idx))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
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
          <Button size="sm" variant="outline" onClick={addItem} disabled={!newItemId}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {draftItems.length > 0 && (
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Notas (opcional)</label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alergias, preferencias..."
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={isPending || !canSubmit}>
        {isPending ? "Creando..." : "Crear pedido"}
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();

  const status = searchParams.get("status") || "";
  const tableId = searchParams.get("tableId") || "";
  const selectedOrderId = searchParams.get("orderId") || null;
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useOrders({ status: status || undefined, tableId: tableId || undefined });
  const { mutate: updateStatus, isPending: updating } = useUpdateOrderStatus();
  const { data: sessionData } = useSession();
  const isAdmin = sessionData?.role === "admin";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (!value) sp.delete(key);
      else sp.set(key, value);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setParam("status", s.value || null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === s.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
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
            <Card key={order.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
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
                    {!["completed", "cancelled"].includes(order.status) && (
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setParam("orderId", order.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status === "ready_to_deliver" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus({ id: order.id, status: "completed" })}
                        disabled={updating}
                      >
                        Entregar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order detail dialog */}
      <Dialog
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setParam("orderId", null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
          </DialogHeader>
          {selectedOrderId && (
            <OrderDetailDialog
              orderId={selectedOrderId}
              onClose={() => setParam("orderId", null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create order dialog (admin) */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pedido</DialogTitle>
          </DialogHeader>
          {createOpen && <CreateOrderDialog onClose={() => setCreateOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
