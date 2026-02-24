import { query, queryOne } from "@/lib/db";

export interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  active: boolean;
  created_at: string;
}

export interface DbMenuItem {
  id: string;
  category_id: string | null;
  category_name?: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCategories(): Promise<DbCategory[]> {
  return query<DbCategory>(
    `SELECT * FROM menu_categories WHERE active = TRUE ORDER BY order_index, name`
  );
}

export async function getCategoryById(id: string): Promise<DbCategory | null> {
  return queryOne<DbCategory>(`SELECT * FROM menu_categories WHERE id = $1`, [id]);
}

export async function createCategory(data: {
  name: string;
  description?: string;
  order_index?: number;
}): Promise<DbCategory> {
  const rows = await query<DbCategory>(
    `INSERT INTO menu_categories (name, description, order_index)
     VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.description ?? null, data.order_index ?? 0]
  );
  return rows[0];
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string; order_index: number; active: boolean }>
): Promise<DbCategory | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); values.push(data.description); }
  if (data.order_index !== undefined) { sets.push(`order_index = $${idx++}`); values.push(data.order_index); }
  if (data.active !== undefined) { sets.push(`active = $${idx++}`); values.push(data.active); }

  if (sets.length === 0) return null;
  values.push(id);

  return queryOne<DbCategory>(
    `UPDATE menu_categories SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
}

export async function deleteCategory(id: string): Promise<boolean> {
  const rows = await query(`UPDATE menu_categories SET active = FALSE WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

// Menu Items
export async function getMenuItems(options?: {
  categoryId?: string;
  availableOnly?: boolean;
}): Promise<DbMenuItem[]> {
  let sql = `
    SELECT mi.*, mc.name AS category_name
    FROM menu_items mi
    LEFT JOIN menu_categories mc ON mi.category_id = mc.id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (options?.categoryId) {
    sql += ` AND mi.category_id = $${idx++}`;
    params.push(options.categoryId);
  }
  if (options?.availableOnly) {
    sql += ` AND mi.available = TRUE`;
  }

  sql += ` ORDER BY mc.order_index, mc.name, mi.name`;
  return query<DbMenuItem>(sql, params);
}

export async function getMenuItemById(id: string): Promise<DbMenuItem | null> {
  return queryOne<DbMenuItem>(
    `SELECT mi.*, mc.name AS category_name
     FROM menu_items mi LEFT JOIN menu_categories mc ON mi.category_id = mc.id
     WHERE mi.id = $1`,
    [id]
  );
}

export async function createMenuItem(data: {
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available?: boolean;
}): Promise<DbMenuItem> {
  const rows = await query<DbMenuItem>(
    `INSERT INTO menu_items (category_id, name, description, price, image_url, available)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.category_id ?? null,
      data.name,
      data.description ?? null,
      data.price,
      data.image_url ?? null,
      data.available ?? true,
    ]
  );
  return rows[0];
}

export async function updateMenuItem(
  id: string,
  data: Partial<{
    category_id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    available: boolean;
  }>
): Promise<DbMenuItem | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.category_id !== undefined) { sets.push(`category_id = $${idx++}`); values.push(data.category_id); }
  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); values.push(data.description); }
  if (data.price !== undefined) { sets.push(`price = $${idx++}`); values.push(data.price); }
  if (data.image_url !== undefined) { sets.push(`image_url = $${idx++}`); values.push(data.image_url); }
  if (data.available !== undefined) { sets.push(`available = $${idx++}`); values.push(data.available); }

  if (sets.length === 0) return null;
  values.push(id);

  return queryOne<DbMenuItem>(
    `UPDATE menu_items SET ${sets.join(", ")}, updated_at = NOW()
     WHERE id = $${idx} RETURNING *`,
    values
  );
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const rows = await query(`UPDATE menu_items SET available = FALSE WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}
