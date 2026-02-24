import { query, queryOne } from "@/lib/db";

export interface DbUser {
  id: string;
  username: string;
  password_hash: string;
  role: "admin" | "waiter" | "chef";
  name: string;
  active: boolean;
  created_at: string;
}

export async function getUserByUsername(username: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT id, username, password_hash, role, name, active, created_at
     FROM users WHERE username = $1 AND active = TRUE`,
    [username]
  );
}

export async function getUserById(id: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT id, username, password_hash, role, name, active, created_at
     FROM users WHERE id = $1`,
    [id]
  );
}

export async function getAllUsers(): Promise<Omit<DbUser, "password_hash">[]> {
  return query<Omit<DbUser, "password_hash">>(
    `SELECT id, username, role, name, active, created_at
     FROM users ORDER BY created_at DESC`
  );
}

export async function createUser(data: {
  username: string;
  passwordHash: string;
  role: string;
  name: string;
}): Promise<DbUser> {
  const rows = await query<DbUser>(
    `INSERT INTO users (username, password_hash, role, name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, password_hash, role, name, active, created_at`,
    [data.username, data.passwordHash, data.role, data.name]
  );
  return rows[0];
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; role: string; active: boolean; passwordHash: string }>
): Promise<DbUser | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.role !== undefined) { sets.push(`role = $${idx++}`); values.push(data.role); }
  if (data.active !== undefined) { sets.push(`active = $${idx++}`); values.push(data.active); }
  if (data.passwordHash !== undefined) { sets.push(`password_hash = $${idx++}`); values.push(data.passwordHash); }

  if (sets.length === 0) return null;
  values.push(id);

  return queryOne<DbUser>(
    `UPDATE users SET ${sets.join(", ")}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING id, username, password_hash, role, name, active, created_at`,
    values
  );
}

export async function deleteUser(id: string): Promise<boolean> {
  const rows = await query(
    `UPDATE users SET active = FALSE WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows.length > 0;
}
