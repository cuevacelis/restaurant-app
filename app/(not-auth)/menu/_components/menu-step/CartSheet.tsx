import { Minus, Plus, Trash2, UtensilsCrossed, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "../_types";

interface CartSheetProps {
  cart: CartItem[];
  orderType: "dine_in" | "takeout";
  notes: string;
  cartTotal: number;
  creatingOrder: boolean;
  onClose: () => void;
  onOrderTypeChange: (type: "dine_in" | "takeout") => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onPlaceOrder: () => void;
}

const ORDER_TYPES = [
  { value: "dine_in", label: "Comer aquí", Icon: UtensilsCrossed },
  { value: "takeout", label: "Para llevar", Icon: Truck },
] as const;

export function CartSheet({
  cart,
  orderType,
  notes,
  cartTotal,
  creatingOrder,
  onClose,
  onOrderTypeChange,
  onUpdateQty,
  onRemoveItem,
  onNotesChange,
  onPlaceOrder,
}: CartSheetProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-background/90 backdrop-blur-sm px-4 pt-4 pb-2">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-muted" />
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Tu pedido</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Continuar comprando
            </Button>
          </div>
        </div>
        <div className="px-4 space-y-3 pb-4">
          <div className="flex gap-2">
            {ORDER_TYPES.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => onOrderTypeChange(value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  orderType === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-muted"
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              </button>
            ))}
          </div>
          <Separator />
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Agrega artículos desde el menú
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.menu_item_id} className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onUpdateQty(item.menu_item_id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onUpdateQty(item.menu_item_id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="flex-1 text-sm">{item.name}</span>
                <span className="text-sm font-medium">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onRemoveItem(item.menu_item_id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
          {cart.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="cart-notes">Notas (opcional)</Label>
                <Textarea
                  id="cart-notes"
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Alergias, preferencias, etc."
                  className="text-sm"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <Button className="w-full" onClick={onPlaceOrder} disabled={creatingOrder}>
                {creatingOrder ? "Enviando pedido..." : "Confirmar pedido"}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
