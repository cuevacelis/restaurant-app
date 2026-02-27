import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem } from "../../_services/useMenu";

interface MenuItemCardProps {
  item: MenuItem;
  cartQuantity: number;
  onAdd: () => void;
  onUpdateQty: (delta: number) => void;
}

export function MenuItemCard({ item, cartQuantity, onAdd, onUpdateQty }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.name} className="h-32 w-full object-cover" />
      ) : null}
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">{item.name}</p>
            {item.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            ) : null}
            <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
          </div>
          <div className="shrink-0">
            {cartQuantity > 0 ? (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdateQty(-1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{cartQuantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdateQty(1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
