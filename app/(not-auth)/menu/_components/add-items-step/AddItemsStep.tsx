import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "../_types";
import type { MenuData } from "../../_services/useMenu";
import type { Order } from "../../_services/useOrder";

interface AddItemsStepProps {
  order: Order | undefined;
  menuData: MenuData | undefined;
  addCart: CartItem[];
  activeCategory: string;
  addingItems: boolean;
  onCategorySelect: (catId: string) => void;
  onAddItem: (item: { id: string; name: string; price: string }) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function AddItemsStep({
  order,
  menuData,
  addCart,
  activeCategory,
  addingItems,
  onCategorySelect,
  onAddItem,
  onUpdateQty,
  onBack,
  onConfirm,
}: AddItemsStepProps) {
  const addCartCount = addCart.reduce((s, c) => s + c.quantity, 0);
  const addCartTotal = addCart.reduce((s, c) => s + c.price * c.quantity, 0);
  const itemsByCategory = menuData?.items.filter((i) => i.category_id === activeCategory) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div>
            <p className="text-sm font-semibold">Agregar más ítems</p>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            Volver al pedido
          </Button>
        </div>
      </header>

      {/* Existing items (locked) */}
      {order?.items ? (
        <div className="mx-4 mt-4 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Ya en tu pedido (no se puede modificar)
          </p>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-xs text-muted-foreground py-0.5"
            >
              <span>
                {item.quantity}× {item.menu_item_name}
              </span>
              <span>{formatCurrency(parseFloat(item.unit_price) * item.quantity)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
        {menuData?.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="p-4 pb-32 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {itemsByCategory.map((item) => {
          const inAddCart = addCart.find((c) => c.menu_item_id === item.id);
          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {inAddCart ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => onUpdateQty(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          {inAddCart.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => onUpdateQty(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => onAddItem(item)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Floating confirm button */}
      {addCartCount > 0 ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <Button
            size="lg"
            className="shadow-xl rounded-full px-6 gap-2"
            onClick={onConfirm}
            disabled={addingItems}
          >
            <Plus className="h-5 w-5" />
            {addingItems ? "Agregando..." : `Añadir al pedido (${addCartCount})`}
            <span className="font-semibold">{formatCurrency(addCartTotal)}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
