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
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'waiter', 'chef')),
  name          VARCHAR(100) NOT NULL,
  active        BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
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
  status                VARCHAR(30)  NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'in_preparation', 'ready_to_deliver', 'completed', 'cancelled', 'paid')),
  notes                 TEXT,
  total_amount          NUMERIC(10,2) DEFAULT 0,
  rating                SMALLINT     CHECK (rating >= 1 AND rating <= 5),
  review_comment        TEXT,
  delivered_by_user_id  UUID         REFERENCES users(id),
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
