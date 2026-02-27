-- ============================================================
-- SEED DATA
-- Run AFTER schema.sql
-- admin   → admin123
-- waiter1 → password
-- chef1   → password
-- ============================================================

INSERT INTO users (username, password_hash, role, name) VALUES
  ('admin',   '$2a$10$FrqnBqOCC/8tCzFr2M//i.ck1EaZlmHPkbSmxYCuRBKoLN0b44cTO', 'admin',  'Administrador'),
  ('waiter1', '$2b$10$v9go8.f0UB1KiY/Fy6eXI.oEwjN9n0aIGGY3ajhGvZHrusbxhj.Pm', 'waiter', 'Carlos Mesero'),
  ('chef1',   '$2b$10$v9go8.f0UB1KiY/Fy6eXI.oEwjN9n0aIGGY3ajhGvZHrusbxhj.Pm', 'chef',   'Ana Cocinera')
ON CONFLICT (username) DO NOTHING;

-- Cambiar contraseñas en producción desde el panel de admin

-- Restaurant tables
INSERT INTO restaurant_tables (number, capacity) VALUES
  (1, 2), (2, 4), (3, 4), (4, 6), (5, 2),
  (6, 4), (7, 4), (8, 8), (9, 2), (10, 4)
ON CONFLICT (number) DO NOTHING;

-- Menu categories
INSERT INTO menu_categories (name, description, order_index) VALUES
  ('Entradas',    'Aperitivos y ensaladas',           1),
  ('Sopas',       'Sopas y caldos del día',           2),
  ('Platos Fuertes', 'Platos principales',            3),
  ('Pastas',      'Pastas frescas y al horno',        4),
  ('Pizzas',      'Pizzas artesanales',               5),
  ('Postres',     'Dulces y helados',                 6),
  ('Bebidas',     'Bebidas frías y calientes',        7),
  ('Cocteles',    'Bebidas con y sin alcohol',        8)
ON CONFLICT DO NOTHING;

-- Menu items (populated after categories are inserted)
DO $$
DECLARE
  cat_entradas    UUID;
  cat_sopas       UUID;
  cat_fuertes     UUID;
  cat_pastas      UUID;
  cat_pizzas      UUID;
  cat_postres     UUID;
  cat_bebidas     UUID;
  cat_cocteles    UUID;
BEGIN
  SELECT id INTO cat_entradas  FROM menu_categories WHERE name = 'Entradas';
  SELECT id INTO cat_sopas     FROM menu_categories WHERE name = 'Sopas';
  SELECT id INTO cat_fuertes   FROM menu_categories WHERE name = 'Platos Fuertes';
  SELECT id INTO cat_pastas    FROM menu_categories WHERE name = 'Pastas';
  SELECT id INTO cat_pizzas    FROM menu_categories WHERE name = 'Pizzas';
  SELECT id INTO cat_postres   FROM menu_categories WHERE name = 'Postres';
  SELECT id INTO cat_bebidas   FROM menu_categories WHERE name = 'Bebidas';
  SELECT id INTO cat_cocteles  FROM menu_categories WHERE name = 'Cocteles';

  INSERT INTO menu_items (category_id, name, description, price) VALUES
    -- Entradas
    (cat_entradas, 'Bruschetta al tomate',   'Pan tostado con tomate fresco, ajo y albahaca',  8.50),
    (cat_entradas, 'Carpaccio de res',        'Láminas de res con parmesano y rúcula',         14.00),
    (cat_entradas, 'Tabla de quesos',         'Surtido de quesos artesanales con mermelada',   18.00),
    (cat_entradas, 'Calamares a la romana',   'Calamares rebozados con salsa alioli',          12.00),
    -- Sopas
    (cat_sopas, 'Sopa de tomate',             'Crema de tomate asado con albahaca',             9.00),
    (cat_sopas, 'Caldo de res',               'Caldo con verduras y carne de res',              8.00),
    (cat_sopas, 'Crema de champiñones',        'Crema cremosa de champiñones silvestres',       10.00),
    -- Platos Fuertes
    (cat_fuertes, 'Filete de res a la parrilla', '300g de filete con papas y ensalada',        28.00),
    (cat_fuertes, 'Pollo a las hierbas',       'Pechuga de pollo con hierbas provenzales',     19.00),
    (cat_fuertes, 'Salmón al limón',           'Salmón al horno con salsa de limón y alcaparras', 24.00),
    (cat_fuertes, 'Costillas BBQ',             'Costillas de cerdo en salsa BBQ casera',        22.00),
    -- Pastas
    (cat_pastas, 'Spaghetti Carbonara',        'Con huevo, pancetta y parmesano',              16.00),
    (cat_pastas, 'Fettuccine Alfredo',         'Crema, mantequilla y parmesano',               15.00),
    (cat_pastas, 'Penne Arrabbiata',           'Salsa de tomate picante con ajo',              14.00),
    (cat_pastas, 'Lasaña Bolognesa',           'Capas de pasta con ragú de res',               18.00),
    -- Pizzas
    (cat_pizzas, 'Margherita',                 'Tomate, mozzarella y albahaca fresca',         16.00),
    (cat_pizzas, 'Pepperoni',                  'Tomate, mozzarella y pepperoni',               18.00),
    (cat_pizzas, 'Cuatro Quesos',              'Mozzarella, gorgonzola, parmesano y cheddar',  19.00),
    (cat_pizzas, 'Veggie',                     'Verduras de temporada y pesto',                17.00),
    -- Postres
    (cat_postres, 'Tiramisú',                  'Clásico tiramisú con café y mascarpone',        9.00),
    (cat_postres, 'Cheesecake de frutos rojos','Base de galleta con crema y frutos rojos',     10.00),
    (cat_postres, 'Helado artesanal',          'Tres bolas de helado a elegir',                 7.00),
    (cat_postres, 'Brownie caliente',          'Brownie con helado de vainilla',                9.00),
    -- Bebidas
    (cat_bebidas, 'Agua mineral',              'Agua natural o con gas 500ml',                  2.50),
    (cat_bebidas, 'Refresco',                  'Coca-Cola, Sprite o Fanta 355ml',               3.00),
    (cat_bebidas, 'Jugo natural',              'Jugo de naranja, mango o piña fresco',          5.00),
    (cat_bebidas, 'Café americano',            'Café de grano molido en el momento',            3.50),
    (cat_bebidas, 'Cappuccino',                'Espresso con leche vaporizada',                 4.50),
    -- Cocteles
    (cat_cocteles, 'Margarita',               'Tequila, triple sec y limón',                  12.00),
    (cat_cocteles, 'Mojito',                  'Ron, menta, limón y azúcar',                   11.00),
    (cat_cocteles, 'Piña Colada',             'Ron, crema de coco y piña',                    12.00),
    (cat_cocteles, 'Sangría',                 'Vino tinto con frutas naturales (jarra)',       22.00)
  ON CONFLICT DO NOTHING;
END $$;
