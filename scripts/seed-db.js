#!/usr/bin/env node
/**
 * db:seed — Inserts default data (users, tables, menu, payment methods)
 * Run AFTER `pnpm run db:setup`
 * Usage: pnpm run db:seed
 */
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const dbConfig = {
  host: process.env.DB_HOST || "restaurant.ckr8w8yqg3ey.us-east-1.rds.amazonaws.com",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Fb21485620.-",
  database: process.env.DB_NAME || "restaurant",
  ssl: { rejectUnauthorized: false },
};

async function run() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  try {
    console.log("✓ Connected to PostgreSQL");

    const seedPath = path.join(__dirname, "../infrastructure/sql/seed.sql");
    const seedSql = fs.readFileSync(seedPath, "utf-8");
    console.log("▶ Running seed.sql...");
    await client.query(seedSql);
    console.log("✓ Seed data inserted\n");

    // Insert default payment method (Yape) if not already present
    await client.query(`
      INSERT INTO payment_methods (name, type, display_text, sort_order)
      VALUES ('Yape', 'manual', 'Yápenos al número +51 999 999 999', 1)
      ON CONFLICT DO NOTHING
    `);
    console.log("✓ Default payment method (Yape) ready\n");

    console.log("✅ Seed complete!");
    console.log("   Admin:   admin / admin123");
    console.log("   Waiter:  waiter1 / password");
    console.log("   Chef:    chef1 / password");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
