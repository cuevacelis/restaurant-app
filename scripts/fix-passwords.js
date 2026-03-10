#!/usr/bin/env node
/**
 * db:fix-pass — Resetea las contraseñas de los usuarios al valor por defecto.
 * Actualiza la tabla `accounts` con el formato scrypt que usa Better Auth.
 */
const readline = require("readline");
const { scryptSync, randomBytes } = require("crypto");
const { createPool } = require("./lib/db");

const USERS = [
  { username: "admin",   password: "admin123" },
  { username: "waiter1", password: "password" },
  { username: "chef1",   password: "password" },
];

// Must match Better Auth's hashPassword: "<hex-salt>:<hex-key>"
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 67108864,
  });
  return `${salt}:${key.toString("hex")}`;
}

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
      const hash = hashPassword(u.password);
      const { rowCount } = await client.query(
        `UPDATE accounts
         SET password = $1, updated_at = NOW()
         WHERE user_id = (SELECT id FROM users WHERE username = $2)
           AND provider_id = 'credential'`,
        [hash, u.username]
      );
      if (rowCount > 0) {
        console.log(`  ✓ ${u.username.padEnd(8)} → ${u.password}`);
      } else {
        console.log(`  ✗ ${u.username.padEnd(8)} → no encontrado en accounts`);
      }
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
