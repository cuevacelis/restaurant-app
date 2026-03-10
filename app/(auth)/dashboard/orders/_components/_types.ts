export interface DraftItem {
  id?: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
}

export { STATUSES_FILTER as STATUSES } from "@/lib/db/order-status";
