#!/usr/bin/env node
/**
 * db:setup — Creates the database and runs schema.sql
 * Usage: pnpm run db:setup
 */
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const dbConfig = {
  host: process.env.DB_HOST || "restaurant.ckr8w8yqg3ey.us-east-1.rds.amazonaws.com",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Fb21485620.-",
  ssl: { rejectUnauthorized: false },
};

const dbName = process.env.DB_NAME || "restaurant";

async function run() {
  // Connect to postgres DB to create the target DB if needed
  const adminPool = new Pool({ ...dbConfig, database: "postgres" });
  const adminClient = await adminPool.connect();
  try {
    const res = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (res.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✓ Database "${dbName}" created`);
    } else {
      console.log(`✓ Database "${dbName}" already exists`);
    }
  } finally {
    adminClient.release();
    await adminPool.end();
  }

  const pool = new Pool({ ...dbConfig, database: dbName });
  const client = await pool.connect();
  try {
    console.log("✓ Connected to PostgreSQL");

    const schemaPath = path.join(__dirname, "../infrastructure/sql/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    console.log("▶ Running schema.sql...");
    await client.query(schemaSql);
    console.log("✓ Schema created\n");

    console.log("✅ Database setup complete!");
    console.log("   Run `pnpm run db:seed` to insert default data.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
