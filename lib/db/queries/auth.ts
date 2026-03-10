import { query, queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export interface DbUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  email_verified: boolean;
  role: "admin" | "waiter" | "chef";
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserByUsername(username: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT id, username, name, email, email_verified, role, active, created_at, updated_at
     FROM users WHERE username = $1 AND active = TRUE`,
    [username]
  );
}

export async function getUserById(id: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT id, username, name, email, email_verified, role, active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
}

export async function getAllUsers(): Promise<DbUser[]> {
  return query<DbUser>(
    `SELECT id, username, name, email, email_verified, role, active, created_at, updated_at
     FROM users ORDER BY created_at DESC`
  );
}

export async function createUser(data: {
  username: string;
  password: string;
  role: string;
  name: string;
}): Promise<DbUser> {
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(data.password, 10);

  const rows = await query<DbUser>(
    `INSERT INTO users (id, username, name, email, email_verified, role, active, created_at, updated_at)
     VALUES ($1, $2, $3, NULL, TRUE, $4, TRUE, NOW(), NOW())
     RETURNING id, username, name, email, email_verified, role, active, created_at, updated_at`,
    [userId, data.username, data.name, data.role]
  );
  const user = rows[0];

  // Create credential account entry for Better Auth
  await query(
    `INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
    [randomUUID(), userId, userId, passwordHash]
  );

  return user;
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; role: string; active: boolean; password: string }>
): Promise<DbUser | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.role !== undefined) { sets.push(`role = $${idx++}`); values.push(data.role); }
  if (data.active !== undefined) { sets.push(`active = $${idx++}`); values.push(data.active); }

  if (sets.length > 0) {
    sets.push(`updated_at = NOW()`);
    values.push(id);
    await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx}`,
      values
    );
  }

  if (data.password) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    await query(
      `UPDATE accounts SET password = $1, updated_at = NOW()
       WHERE user_id = $2 AND provider_id = 'credential'`,
      [passwordHash, id]
    );
  }

  return getUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  const rows = await query(
    `UPDATE users SET active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows.length > 0;
}
