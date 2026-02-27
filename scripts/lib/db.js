const { Pool } = require("pg");

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Variables de entorno faltantes: ${missing.join(", ")}`);
  console.error("   Crea .env.local y ejecuta con: pnpm db:<comando>");
  process.exit(1);
}

const DB_NAME = process.env.DB_NAME || "restaurant";

const baseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // DB_SSL=false para desarrollo local sin SSL
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
};

function createPool(database = DB_NAME) {
  return new Pool({ ...baseConfig, database });
}

module.exports = { createPool, DB_NAME };
