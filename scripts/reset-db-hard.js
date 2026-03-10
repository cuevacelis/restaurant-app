#!/usr/bin/env node
/**
 * db:reset-hard — Borra todo el contenido de la DB y lo recrea desde cero.
 * Usa DROP SCHEMA public CASCADE en lugar de DROP DATABASE para evitar
 * requerir conexión a la DB de mantenimiento 'postgres' (no disponible en RDS).
 *
 * ADVERTENCIA: borra TODOS los datos sin posibilidad de recuperación.
 * Requiere confirmación interactiva salvo que se pase --force.
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { createPool, DB_NAME } = require("./lib/db");

const FORCE = process.argv.includes("--force");

async function confirm() {
  if (FORCE) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve) => {
    rl.question(
      `⚠️  Esto eliminará TODOS los datos de "${DB_NAME}" sin posibilidad de recuperación.\n   ¿Confirmar? [y/N] `,
      (ans) => {
        rl.close();
        if (ans.toLowerCase() !== "y") {
          console.log("Cancelado.");
          process.exit(0);
        }
        resolve();
      }
    );
  });
}

async function run() {
  await confirm();

  const pool = createPool();
  const client = await pool.connect();
  try {
    console.log("▶ Limpiando schema...");
    // Elimina todas las tablas, funciones, tipos, etc. del schema public
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    console.log(`✓ Schema public recreado en "${DB_NAME}"`);

    const schema = fs.readFileSync(
      path.join(__dirname, "../infrastructure/sql/schema.sql"),
      "utf-8"
    );
    console.log("▶ Aplicando schema.sql...");
    await client.query(schema);
    console.log("✓ Schema aplicado");

    const seed = fs.readFileSync(
      path.join(__dirname, "../infrastructure/sql/seed.sql"),
      "utf-8"
    );
    console.log("▶ Aplicando seed.sql...");
    await client.query(seed);
    console.log("✓ Seed aplicado");
  } finally {
    client.release();
    await pool.end();
  }

  console.log("\n✅ Reset completo. DB lista con datos iniciales.");
  console.log("   Recuerda reinstalar los triggers: pnpm db:triggers:dev");
}

run().catch((err) => {
  console.error("❌ Error en reset:", err.message);
  process.exit(1);
});
