import { ShoppingCart, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface MenuHeaderProps {
  customerName: string;
  cartCount: number;
  onCartClick: () => void;
  tableId?: string;
}

export function MenuHeader({ customerName, cartCount, onCartClick, tableId }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold leading-none">
              {tableId ? `Mesa #${tableId}` : "Menú"}
            </p>
            <p className="text-xs text-muted-foreground">{customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="outline" size="sm" className="relative" onClick={onCartClick}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            Carrito
            {cartCount > 0 ? (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {cartCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </header>
  );
}
