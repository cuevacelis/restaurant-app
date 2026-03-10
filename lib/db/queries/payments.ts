import { query, queryOne } from "@/lib/db";

export interface DbPaymentMethod {
  id: string;
  name: string;
  type: "manual" | "mercadopago";
  display_text: string | null;
  config: Record<string, string>;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Public-safe version (no config secrets)
export interface DbPaymentMethodPublic {
  id: string;
  name: string;
  type: string;
  display_text: string | null;
  sort_order: number;
}

export async function getActivePaymentMethods(): Promise<DbPaymentMethodPublic[]> {
  return query<DbPaymentMethodPublic>(
    `SELECT id, name, type, display_text, sort_order
     FROM payment_methods WHERE active = TRUE ORDER BY sort_order, name`
  );
}

export async function getAllPaymentMethods(): Promise<DbPaymentMethod[]> {
  return query<DbPaymentMethod>(`SELECT * FROM payment_methods ORDER BY sort_order, name`);
}

export async function getPaymentMethodById(id: string): Promise<DbPaymentMethod | null> {
  return queryOne<DbPaymentMethod>(`SELECT * FROM payment_methods WHERE id = $1`, [id]);
}

export async function createPaymentMethod(data: {
  name: string;
  type: "manual" | "mercadopago";
  display_text?: string;
  config?: Record<string, unknown>;
  sort_order?: number;
}): Promise<DbPaymentMethod> {
  const rows = await query<DbPaymentMethod>(
    `INSERT INTO payment_methods (name, type, display_text, config, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      data.name,
      data.type,
      data.display_text ?? null,
      JSON.stringify(data.config ?? {}),
      data.sort_order ?? 0,
    ]
  );
  return rows[0];
}

export async function updatePaymentMethod(
  id: string,
  data: Partial<{
    name: string;
    type: "manual" | "mercadopago";
    display_text: string | null;
    config: Record<string, unknown>;
    active: boolean;
    sort_order: number;
  }>
): Promise<DbPaymentMethod | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.name !== undefined) { sets.push(`name = $${i++}`); values.push(data.name); }
  if (data.type !== undefined) { sets.push(`type = $${i++}`); values.push(data.type); }
  if (data.display_text !== undefined) { sets.push(`display_text = $${i++}`); values.push(data.display_text); }
  if (data.config !== undefined) { sets.push(`config = $${i++}`); values.push(JSON.stringify(data.config)); }
  if (data.active !== undefined) { sets.push(`active = $${i++}`); values.push(data.active); }
  if (data.sort_order !== undefined) { sets.push(`sort_order = $${i++}`); values.push(data.sort_order); }

  if (!sets.length) return null;
  sets.push(`updated_at = NOW()`);
  values.push(id);

  return queryOne<DbPaymentMethod>(
    `UPDATE payment_methods SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  const rows = await query(
    `UPDATE payment_methods SET active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows.length > 0;
}
