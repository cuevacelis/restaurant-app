import { query, queryOne } from "@/lib/db";

export interface DbTable {
  id: string;
  number: number;
  capacity: number;
  active: boolean;
  created_at: string;
}

export async function getTables(): Promise<DbTable[]> {
  return query<DbTable>(
    `SELECT * FROM restaurant_tables WHERE active = TRUE ORDER BY number`
  );
}

export async function getTableById(id: string): Promise<DbTable | null> {
  return queryOne<DbTable>(
    `SELECT * FROM restaurant_tables WHERE id = $1`,
    [id]
  );
}

export async function getTableByNumber(number: number): Promise<DbTable | null> {
  return queryOne<DbTable>(
    `SELECT * FROM restaurant_tables WHERE number = $1 AND active = TRUE`,
    [number]
  );
}

export async function createTable(data: {
  number: number;
  capacity: number;
}): Promise<DbTable> {
  const rows = await query<DbTable>(
    `INSERT INTO restaurant_tables (number, capacity) VALUES ($1, $2) RETURNING *`,
    [data.number, data.capacity]
  );
  return rows[0];
}

export async function updateTable(
  id: string,
  data: Partial<{ number: number; capacity: number; active: boolean }>
): Promise<DbTable | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.number !== undefined) { sets.push(`number = $${idx++}`); values.push(data.number); }
  if (data.capacity !== undefined) { sets.push(`capacity = $${idx++}`); values.push(data.capacity); }
  if (data.active !== undefined) { sets.push(`active = $${idx++}`); values.push(data.active); }

  if (sets.length === 0) return null;
  values.push(id);

  return queryOne<DbTable>(
    `UPDATE restaurant_tables SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
}

export async function deleteTable(id: string): Promise<boolean> {
  const rows = await query(
    `UPDATE restaurant_tables SET active = FALSE WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows.length > 0;
}
