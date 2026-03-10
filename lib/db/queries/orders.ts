import { query, queryOne, withTransaction } from "@/lib/db";
import { PoolClient } from "pg";

import type { OrderStatus } from "@/lib/db/order-status";
export type { OrderStatus };
export type OrderType = "dine_in" | "takeout";

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name?: string;
  quantity: number;
  unit_price: string;
  notes: string | null;
}

export interface DbOrder {
  id: string;
  table_id: string | null;
  table_number?: number | null;
  customer_name: string;
  order_type: OrderType;
  status: OrderStatus;
  notes: string | null;
  total_amount: string;
  rating: number | null;
  review_comment: string | null;
  delivered_by_user_id: string | null;
  delivered_by_name?: string | null;
  created_at: string;
  updated_at: string;
  items?: DbOrderItem[];
}

export async function getOrders(options?: {
  status?: OrderStatus;
  tableId?: string;
  limit?: number;
  offset?: number;
}): Promise<DbOrder[]> {
  let sql = `
    SELECT o.*,
           rt.number AS table_number
    FROM orders o
    LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (options?.status) {
    sql += ` AND o.status = $${idx++}`;
    params.push(options.status);
  }
  if (options?.tableId) {
    sql += ` AND o.table_id = $${idx++}`;
    params.push(options.tableId);
  }

  sql += ` ORDER BY o.created_at DESC`;

  if (options?.limit) {
    sql += ` LIMIT $${idx++}`;
    params.push(options.limit);
  }
  if (options?.offset) {
    sql += ` OFFSET $${idx++}`;
    params.push(options.offset);
  }

  return query<DbOrder>(sql, params);
}

export async function getOrderById(id: string): Promise<DbOrder | null> {
  const order = await queryOne<DbOrder>(
    `SELECT o.*, rt.number AS table_number, u.name AS delivered_by_name
     FROM orders o
     LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
     LEFT JOIN users u ON o.delivered_by_user_id = u.id
     WHERE o.id = $1`,
    [id]
  );
  if (!order) return null;

  const items = await query<DbOrderItem>(
    `SELECT oi.*, mi.name AS menu_item_name
     FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = $1`,
    [id]
  );
  order.items = items;
  return order;
}

export async function getOrdersByTable(tableId: string): Promise<DbOrder[]> {
  return getOrders({ tableId });
}

export async function createOrder(data: {
  table_id?: string;
  customer_name: string;
  order_type: OrderType;
  notes?: string;
  status?: OrderStatus;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }>;
}): Promise<DbOrder> {
  return withTransaction(async (client: PoolClient) => {
    // Calculate total
    const total = data.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const orderResult = await client.query(
      `INSERT INTO orders (table_id, customer_name, order_type, notes, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.table_id ?? null,
        data.customer_name,
        data.order_type,
        data.notes ?? null,
        total,
        data.status ?? "pending_verification",
      ]
    );
    const order: DbOrder = orderResult.rows[0];

    for (const item of data.items) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_item_id, item.quantity, item.unit_price, item.notes ?? null]
      );
    }

    return order;
  });
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  userId?: string
): Promise<DbOrder | null> {
  if (status === "completed" && userId) {
    return queryOne<DbOrder>(
      `UPDATE orders SET status = $1, delivered_by_user_id = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, userId, id]
    );
  }
  return queryOne<DbOrder>(
    `UPDATE orders SET status = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [status, id]
  );
}

export async function updateOrderTable(
  orderId: string,
  tableId: string | null
): Promise<DbOrder | null> {
  return queryOne<DbOrder>(
    `UPDATE orders SET table_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [tableId, orderId]
  );
}

export async function updateOrderItems(
  orderId: string,
  items: Array<{ menu_item_id: string; quantity: number; unit_price: number; notes?: string }>
): Promise<DbOrder | null> {
  return withTransaction(async (client: PoolClient) => {
    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.notes ?? null]
      );
    }
    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    return queryOne<DbOrder>(
      `UPDATE orders SET total_amount = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [total, orderId]
    );
  });
}

export async function appendOrderItems(
  orderId: string,
  newItems: Array<{ menu_item_id: string; quantity: number; unit_price: number; notes?: string }>
): Promise<DbOrder | null> {
  return withTransaction(async (client: PoolClient) => {
    for (const item of newItems) {
      const existing = await client.query(
        `SELECT id FROM order_items WHERE order_id = $1 AND menu_item_id = $2`,
        [orderId, item.menu_item_id]
      );
      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE order_items SET quantity = quantity + $1 WHERE id = $2`,
          [item.quantity, existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.menu_item_id, item.quantity, item.unit_price, item.notes ?? null]
        );
      }
    }
    const totals = await client.query(
      `SELECT COALESCE(SUM(unit_price * quantity), 0) AS total FROM order_items WHERE order_id = $1`,
      [orderId]
    );
    const total = totals.rows[0].total;
    return queryOne<DbOrder>(
      `UPDATE orders SET total_amount = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [total, orderId]
    );
  });
}

export async function addOrderReview(
  id: string,
  data: { rating: number; comment?: string }
): Promise<DbOrder | null> {
  return queryOne<DbOrder>(
    `UPDATE orders SET rating = $1, review_comment = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [data.rating, data.comment ?? null, id]
  );
}

export async function getActiveOrdersByTable(): Promise<
  Array<{ table_number: number; order_count: number; oldest_order: string }>
> {
  return query(
    `SELECT rt.number AS table_number,
            COUNT(o.id) AS order_count,
            MIN(o.created_at) AS oldest_order
     FROM orders o
     JOIN restaurant_tables rt ON o.table_id = rt.id
     WHERE o.status != 'completed'
     GROUP BY rt.number
     ORDER BY rt.number`
  );
}

export async function getOrderStats(): Promise<{
  total: number;
  pending_verification: number;
  pending: number;
  in_preparation: number;
  ready_to_deliver: number;
  completed: number;
  cancelled: number;
  paid: number;
}> {
  const rows = await query<{ status: OrderStatus; count: string }>(
    `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
  );
  const stats = { total: 0, pending_verification: 0, pending: 0, in_preparation: 0, ready_to_deliver: 0, completed: 0, cancelled: 0, paid: 0 };
  for (const row of rows) {
    const c = parseInt(row.count, 10);
    stats.total += c;
    if (row.status in stats) {
      (stats as Record<string, number>)[row.status] = c;
    }
  }
  return stats;
}
