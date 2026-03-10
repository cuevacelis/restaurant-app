-- ============================================================
-- SEED DATA
-- Run AFTER schema.sql
-- admin   → admin123
-- waiter1 → password
-- chef1   → password
-- Note: Users are created via seed-db.js (handles Better Auth schema)
-- ============================================================

-- Cambiar contraseñas en producción desde el panel de admin

-- ── Configuración global ─────────────────────────────────────
-- currency_code:   código ISO 4217 (PEN = Sol peruano)
-- currency_locale: locale BCP 47 para Intl.NumberFormat
INSERT INTO restaurant_config (key, value) VALUES
  ('currency_code',   'PEN'),
  ('currency_locale', 'es-PE')
ON CONFLICT (key) DO NOTHING;

-- ── Mesas ────────────────────────────────────────────────────
INSERT INTO restaurant_tables (number, capacity) VALUES
  (1, 2), (2, 4), (3, 4), (4, 6), (5, 2),
  (6, 4), (7, 4), (8, 8), (9, 2), (10, 4)
ON CONFLICT (number) DO NOTHING;

-- ── Categorías del menú ──────────────────────────────────────
INSERT INTO menu_categories (name, description, order_index) VALUES
  ('Entradas',        'Causas, ceviches y aperitivos',          1),
  ('Sopas y Caldos',  'Sopas y caldos tradicionales',           2),
  ('Platos de Fondo', 'Platos principales de la cocina peruana',3),
  ('Mariscos',        'Pescados y mariscos frescos',            4),
  ('Postres',         'Dulces tradicionales peruanos',          5),
  ('Bebidas',         'Bebidas frías y calientes',              6),
  ('Cocteles',        'Bebidas con y sin alcohol',              7)
ON CONFLICT DO NOTHING;

-- ── Platos del menú ──────────────────────────────────────────
-- Precios en Soles (S/)
DO $$
DECLARE
  cat_entradas UUID;
  cat_sopas    UUID;
  cat_fondo    UUID;
  cat_mariscos UUID;
  cat_postres  UUID;
  cat_bebidas  UUID;
  cat_cocteles UUID;
BEGIN
  SELECT id INTO cat_entradas FROM menu_categories WHERE name = 'Entradas';
  SELECT id INTO cat_sopas    FROM menu_categories WHERE name = 'Sopas y Caldos';
  SELECT id INTO cat_fondo    FROM menu_categories WHERE name = 'Platos de Fondo';
  SELECT id INTO cat_mariscos FROM menu_categories WHERE name = 'Mariscos';
  SELECT id INTO cat_postres  FROM menu_categories WHERE name = 'Postres';
  SELECT id INTO cat_bebidas  FROM menu_categories WHERE name = 'Bebidas';
  SELECT id INTO cat_cocteles FROM menu_categories WHERE name = 'Cocteles';

  INSERT INTO menu_items (category_id, name, description, price) VALUES
    -- Entradas
    (cat_entradas, 'Papa a la Huancaína',
      'Papas amarillas bañadas en crema de ají amarillo, huevo y galleta. Con aceituna y huevo duro',
      22.00),
    (cat_entradas, 'Causa Rellena',
      'Masa de papa amarilla con ají amarillo, rellena de pollo desmenuzado y palta',
      24.00),
    (cat_entradas, 'Ceviche de Pescado',
      'Pescado fresco marinado en limón, ají limo, cebolla morada y culantro. Con choclo y cancha',
      38.00),
    (cat_entradas, 'Anticuchos de Corazón',
      'Brochetas de corazón de res marinadas en ají panca, servidas con papa sancochada y choclo',
      28.00),
    (cat_entradas, 'Tequeños de Queso',
      'Palitos de masa frita rellenos de queso fresco, acompañados de guacamole',
      20.00),

    -- Sopas y Caldos
    (cat_sopas, 'Caldo de Gallina',
      'Caldo sustancioso de gallina con fideos, papa, huevo y hierbas aromáticas',
      28.00),
    (cat_sopas, 'Aguadito de Pollo',
      'Sopa verde con pollo, culantro, arroz, alverjas y choclo',
      26.00),
    (cat_sopas, 'Sopa Criolla',
      'Sopa de fideos cabello de ángel con carne molida, tomate, leche evaporada y ají panca',
      24.00),
    (cat_sopas, 'Chupe de Camarones',
      'Sopa espesa con camarones frescos, papa, huevo, leche y ají amarillo',
      45.00),

    -- Platos de Fondo
    (cat_fondo, 'Lomo Saltado',
      'Tiras de lomo fino salteadas con cebolla, tomate, ají amarillo y sillao. Con arroz blanco y papas fritas',
      52.00),
    (cat_fondo, 'Arroz con Pollo',
      'Arroz verde con culantro y ají amarillo, con pollo guisado. Acompañado de salsa criolla',
      38.00),
    (cat_fondo, 'Ají de Gallina',
      'Gallina desmenuzada en crema de ají amarillo con pan, nueces y parmesano. Con arroz blanco y papa amarilla',
      42.00),
    (cat_fondo, 'Seco de Res',
      'Guiso de res con chicha de jora, culantro y ají amarillo. Acompañado de frejoles y arroz',
      45.00),
    (cat_fondo, 'Pollo a la Brasa (1/4)',
      'Cuarto de pollo marinado con especias y asado a la brasa. Con papas fritas y ensalada',
      35.00),
    (cat_fondo, 'Chicharrón de Cerdo',
      'Cerdo cocido y frito hasta quedar crocante, con camote frito, salsa criolla y mote',
      42.00),
    (cat_fondo, 'Tacu Tacu con Lomo',
      'Mezcla cremosa de frejoles y arroz frita en sartén, acompañada de lomo saltado',
      55.00),

    -- Mariscos
    (cat_mariscos, 'Ceviche Mixto',
      'Pescado, pulpo, langostinos y conchas negras en leche de tigre. Con choclo desgranado y cancha',
      52.00),
    (cat_mariscos, 'Arroz con Mariscos',
      'Arroz cremoso con conchas, calamares, langostinos y pulpo en salsa de mariscos y ají amarillo',
      58.00),
    (cat_mariscos, 'Jalea de Mariscos',
      'Mix de mariscos y pescado apanados y fritos. Con salsa tártara, yuca frita y salsa criolla',
      55.00),
    (cat_mariscos, 'Tiradito de Lenguado',
      'Láminas finas de lenguado fresco en crema de ají amarillo con gotas de limón y aceite de oliva',
      48.00),

    -- Postres
    (cat_postres, 'Suspiro de Limeña',
      'Manjar blanco con merengue italiano perfumado con oporto y canela',
      18.00),
    (cat_postres, 'Arroz con Leche',
      'Arroz cremoso cocido en leche con canela, clavo de olor y esencia de vainilla',
      14.00),
    (cat_postres, 'Picarones',
      'Buñuelos de camote y zapallo, fritos y bañados en miel de chancaca con clavo y anís',
      16.00),
    (cat_postres, 'Mazamorra Morada',
      'Postre espeso de maíz morado con frutas secas, membrillo, canela y clavo',
      14.00),

    -- Bebidas
    (cat_bebidas, 'Chicha Morada',
      'Bebida tradicional de maíz morado con trozos de piña, limón y canela (vaso)',
      10.00),
    (cat_bebidas, 'Maracuyá Natural',
      'Jugo de maracuyá fresco con agua o leche y azúcar al gusto',
      12.00),
    (cat_bebidas, 'Inca Kola',
      'Gaseosa nacional en lata 355ml',
       8.00),
    (cat_bebidas, 'Agua Mineral',
      'Agua natural o con gas 625ml',
       6.00),
    (cat_bebidas, 'Café Pasado',
      'Café negro de altura, pasado al momento',
      10.00),

    -- Cocteles
    (cat_cocteles, 'Pisco Sour',
      'Pisco quebranta, jugo de limón, jarabe de goma, clara de huevo y amargo de angostura',
      28.00),
    (cat_cocteles, 'Chilcano de Pisco',
      'Pisco, ginger ale, jugo de limón y unas gotas de amargo de angostura',
      24.00),
    (cat_cocteles, 'Algarrobina',
      'Pisco, algarrobina, leche evaporada, yema de huevo, azúcar y canela en polvo',
      26.00),
    (cat_cocteles, 'Maracuyá Sour',
      'Pisco, jugo de maracuyá, jarabe de goma y clara de huevo. Con amargo de angostura',
      28.00)
  ON CONFLICT DO NOTHING;
END $$;

-- ── Método de pago por defecto ───────────────────────────────
INSERT INTO payment_methods (name, type, display_text, sort_order) VALUES
  ('Yape', 'manual', 'Yapea al número 999-888-777 con el número de tu mesa como concepto.', 1)
ON CONFLICT DO NOTHING;
