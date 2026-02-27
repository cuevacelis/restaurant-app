export interface Table {
  id: string;
  number: number;
  capacity: number;
  active: boolean;
  created_at: string;
}

export interface TableWithOrders extends Table {
  order_count: number;
  oldest_order: string | null;
}
