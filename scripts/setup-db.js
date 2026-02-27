#!/usr/bin/env node
/**
 * db:setup — Crea la base de datos y aplica schema.sql
 */
const fs = require("fs");
const path = require("path");
const { createPool, DB_NAME } = require("./lib/db");

async function run() {
  // Conectar a 'postgres' para crear la DB si no existe
  const adminPool = createPool("postgres");
  const admin = await adminPool.connect();
  try {
    const { rowCount } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✓ Base de datos "${DB_NAME}" creada`);
    } else {
      console.log(`✓ Base de datos "${DB_NAME}" ya existe`);
    }
  } finally {
    admin.release();
    await adminPool.end();
  }

  // Aplicar schema
  const pool = createPool();
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "../infrastructure/sql/schema.sql"),
      "utf-8"
    );
    console.log("▶ Aplicando schema.sql...");
    await client.query(sql);
    console.log("✓ Schema aplicado\n");
    console.log("✅ Setup completo. Siguiente: pnpm db:seed");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Error en setup:", err.message);
  process.exit(1);
});
