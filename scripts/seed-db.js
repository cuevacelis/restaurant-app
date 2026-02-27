#!/usr/bin/env node
/**
 * db:seed — Inserta datos por defecto (usuarios, mesas, menú, método de pago)
 */
const fs = require("fs");
const path = require("path");
const { createPool } = require("./lib/db");

async function run() {
  const pool = createPool();
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "../infrastructure/sql/seed.sql"),
      "utf-8"
    );
    console.log("▶ Insertando datos base...");
    await client.query(sql);
    console.log("✓ Usuarios, mesas y menú insertados");

    await client.query(`
      INSERT INTO payment_methods (name, type, display_text, sort_order)
      VALUES ('Yape', 'manual', 'Yápenos al número +51 999 999 999', 1)
      ON CONFLICT DO NOTHING
    `);
    console.log("✓ Método de pago Yape listo\n");

    console.log("✅ Seed completo.");
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
