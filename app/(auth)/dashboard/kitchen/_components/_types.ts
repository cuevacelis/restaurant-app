import type { OrderStatus } from "@/lib/db/queries/orders";

export interface KitchenOrder {
  id: string;
  table_id: string | null;
  table_number: number | null;
  customer_name: string;
  order_type: "dine_in" | "takeout";
  status: OrderStatus;
  notes: string | null;
  total_amount: string;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: string;
    menu_item_id: string;
    menu_item_name: string;
    quantity: number;
    unit_price: string;
    notes: string | null;
  }>;
}
