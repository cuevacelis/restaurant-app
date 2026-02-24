#!/usr/bin/env node
/**
 * Fixes/resets user passwords in DB
 * Usage: node scripts/fix-passwords.js
 */
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  host: process.env.DB_HOST || "restaurant.ckr8w8yqg3ey.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: process.env.DB_NAME || "restaurant",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Fb21485620.-",
  ssl: { rejectUnauthorized: false },
});

const users = [
  { username: "admin",   password: "admin123",   role: "admin",  name: "Administrador" },
  { username: "waiter1", password: "waiter123",  role: "waiter", name: "Carlos Mesero" },
  { username: "chef1",   password: "chef123",    role: "chef",   name: "Ana Cocinera" },
];

async function run() {
  const client = await pool.connect();
  try {
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      // Upsert: insert or update if already exists
      await client.query(
        `INSERT INTO users (username, password_hash, role, name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username)
         DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE`,
        [u.username, hash, u.role, u.name]
      );
      console.log(`✓ ${u.username} → password: ${u.password}`);
    }
    console.log("\n✅ Passwords updated!");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
