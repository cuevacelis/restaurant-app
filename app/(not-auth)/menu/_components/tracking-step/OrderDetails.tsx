import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "../../_services/useOrder";

interface OrderDetailsProps {
  items: NonNullable<Order["items"]>;
  totalAmount: string;
}

export function OrderDetails({ items, totalAmount }: OrderDetailsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Tu pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantity}× {item.menu_item_name}
            </span>
            <span className="font-medium">
              {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
            </span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
