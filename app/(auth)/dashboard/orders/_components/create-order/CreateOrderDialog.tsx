"use client";

import { useState } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTables, useMenuItems, useCreateOrder } from "../../services/useOrders";
import { formatCurrency } from "@/lib/utils";
import { upsertDraftItem, updateDraftQty } from "../../_lib/draft-items";
import type { DraftItem } from "../_types";

interface Props {
  onClose: () => void;
}

export function CreateOrderDialog({ onClose }: Props) {
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
    setDraftItems((prev) => upsertDraftItem(prev, menuItem));
    setNewItemId("");
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
        items: draftItems.map((d) => ({
          menu_item_id: d.menu_item_id,
          quantity: d.quantity,
          unit_price: d.unit_price,
        })),
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
              onClick={() => setDraftItems((p) => p.filter((_, i) => i !== idx))}
            >
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
