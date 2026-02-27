export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

export type MenuStep = "name" | "menu" | "cart" | "tracking" | "add-items";
