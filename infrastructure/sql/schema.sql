-- ============================================================
-- RESTAURANT APP - POSTGRESQL SCHEMA
-- Compatible with PostgreSQL 18.2-r1 (AWS RDS)
-- Run this ONCE on a fresh database to set up all tables.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "aws_lambda" CASCADE;  -- For DB → Lambda triggers

-- ============================================================
-- USERS (staff: admin, waiter, chef)
-- Managed by Better Auth. Passwords stored in accounts table.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id             TEXT         PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          TEXT         UNIQUE,
  email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  image          TEXT,
  username       TEXT         UNIQUE,
  role           TEXT         NOT NULL DEFAULT 'waiter' CHECK (role IN ('admin', 'waiter', 'chef')),
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BETTER AUTH: sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT        PRIMARY KEY,
  expires_at  TIMESTAMPTZ NOT NULL,
  token       TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  TEXT,
  user_agent  TEXT,
  user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- BETTER AUTH: accounts (credentials + OAuth)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id                       TEXT        PRIMARY KEY,
  account_id               TEXT        NOT NULL,
  provider_id              TEXT        NOT NULL,
  user_id                  TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token             TEXT,
  refresh_token            TEXT,
  id_token                 TEXT,
  access_token_expires_at  TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope                    TEXT,
  password                 TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BETTER AUTH: verifications
-- ============================================================
CREATE TABLE IF NOT EXISTS verifications (
  id         TEXT        PRIMARY KEY,
  identifier TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER      DEFAULT 0,
  active      BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID         REFERENCES menu_categories(id) ON DELETE SET NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url   TEXT,
  available   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- RESTAURANT TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  number     INTEGER UNIQUE NOT NULL,
  capacity   INTEGER NOT NULL DEFAULT 4,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  type         VARCHAR(30)  NOT NULL CHECK (type IN ('manual', 'mercadopago')),
  display_text TEXT,
  config       JSONB        NOT NULL DEFAULT '{}',
  active       BOOLEAN      DEFAULT TRUE,
  sort_order   INTEGER      DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id              UUID         REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  customer_name         VARCHAR(100) NOT NULL,
  order_type            VARCHAR(20)  NOT NULL CHECK (order_type IN ('dine_in', 'takeout')),
  status                VARCHAR(30)  NOT NULL DEFAULT 'pending_verification'
                          CHECK (status IN ('pending_verification', 'pending', 'in_preparation', 'ready_to_deliver', 'completed', 'cancelled', 'paid')),
  notes                 TEXT,
  total_amount          NUMERIC(10,2) DEFAULT 0,
  rating                SMALLINT     CHECK (rating >= 1 AND rating <= 5),
  review_comment        TEXT,
  delivered_by_user_id  TEXT         REFERENCES users(id),
  payment_method_id     UUID         REFERENCES payment_methods(id),
  payment_intent_id     VARCHAR(255),
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ  DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id   ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID          NOT NULL REFERENCES menu_items(id),
  quantity     INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   NUMERIC(10,2) NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- HELPER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RESTAURANT CONFIG (key/value settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_config (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_restaurant_config_updated_at
  BEFORE UPDATE ON restaurant_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
