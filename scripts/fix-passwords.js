#!/usr/bin/env node
/**
 * db:fix-passwords — Resetea las contraseñas de los usuarios al valor por defecto
 */
const readline = require("readline");
const bcrypt = require("bcryptjs");
const { createPool } = require("./lib/db");

const USERS = [
  { username: "admin",   password: "admin123", role: "admin",  name: "Administrador" },
  { username: "waiter1", password: "password", role: "waiter", name: "Carlos Mesero" },
  { username: "chef1",   password: "password", role: "chef",   name: "Ana Cocinera"  },
];

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^[yY]$/.test(answer));
    });
  });
}

async function run() {
  const ok = await confirm("¿Resetear contraseñas al valor por defecto? [y/N] ");
  if (!ok) { console.log("Cancelado."); return; }

  const pool = createPool();
  const client = await pool.connect();
  try {
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (username, password_hash, role, name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username)
         DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE`,
        [u.username, hash, u.role, u.name]
      );
      console.log(`  ✓ ${u.username.padEnd(8)} → ${u.password}`);
    }
    console.log("\n✅ Contraseñas reseteadas.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
