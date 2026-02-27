export interface DraftItem {
  id?: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
}

export const STATUSES: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "in_preparation", label: "En preparación" },
  { value: "ready_to_deliver", label: "Listos" },
  { value: "completed", label: "Entregados" },
  { value: "paid", label: "Pagados" },
  { value: "cancelled", label: "Cancelados" },
];
