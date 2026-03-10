#!/usr/bin/env node
/**
 * db:seed — Inserta datos por defecto (usuarios, mesas, menú, método de pago)
 * Users are created using Better Auth's schema (users + accounts tables).
 */
const fs = require("fs");
const path = require("path");
const { scryptSync, randomBytes, randomUUID } = require("crypto");
const { createPool } = require("./lib/db");

// Must match Better Auth's hashPassword in dist/crypto/password.mjs:
// salt = 16 random bytes as hex string; key = scrypt(password, salt, 64) as hex
// Format: "<hex-salt>:<hex-key>"
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 67108864,
  });
  return `${salt}:${key.toString("hex")}`;
}

const DEFAULT_USERS = [
  { username: "admin",   name: "Administrador",  password: "admin123",  role: "admin"  },
  { username: "waiter1", name: "Carlos Mesero",  password: "password",  role: "waiter" },
  { username: "chef1",   name: "Ana Cocinera",   password: "password",  role: "chef"   },
];

async function seedUsers(client) {
  console.log("▶ Creando usuarios...");
  for (const u of DEFAULT_USERS) {
    const passwordHash = hashPassword(u.password);
    const userId = randomUUID();

    await client.query(`
      INSERT INTO users (id, username, name, email, email_verified, role, active, created_at, updated_at)
      VALUES ($1, $2, $3, NULL, TRUE, $4, TRUE, NOW(), NOW())
      ON CONFLICT (username) DO NOTHING
    `, [userId, u.username, u.name, u.role]);

    // Retrieve the actual user ID (in case it already existed)
    const { rows } = await client.query(
      `SELECT id FROM users WHERE username = $1`,
      [u.username]
    );
    const actualId = rows[0]?.id;
    if (!actualId) continue;

    // Create credential account entry for Better Auth
    // account_id must be the username (the login identifier), not the user UUID
    await client.query(`
      INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [randomUUID(), u.username, actualId, passwordHash]);
  }
  console.log("✓ Usuarios creados");
}

async function run() {
  const pool = createPool();
  const client = await pool.connect();
  try {
    // Seed users (Better Auth schema)
    await seedUsers(client);

    // Run the rest of seed.sql (tables, menu, config, payment methods)
    const sql = fs.readFileSync(
      path.join(__dirname, "../infrastructure/sql/seed.sql"),
      "utf-8"
    );
    await client.query(sql);
    console.log("✓ Mesas, menú y configuración insertados");

    console.log("\n✅ Seed completo.");
    console.log("   admin   → admin123");
    console.log("   waiter1 → password");
    console.log("   chef1   → password");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Error en seed:", err.message);
  process.exit(1);
});
