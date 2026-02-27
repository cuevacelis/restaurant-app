import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CartFabProps {
  cartCount: number;
  cartTotal: number;
  onClick: () => void;
}

export function CartFab({ cartCount, cartTotal, onClick }: CartFabProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
      <Button onClick={onClick} size="lg" className="shadow-xl rounded-full px-6 gap-2">
        <ShoppingCart className="h-5 w-5" />
        Ver pedido ({cartCount})
        <span className="ml-1 font-semibold">{formatCurrency(cartTotal)}</span>
      </Button>
    </div>
  );
}
