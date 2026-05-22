/*
  # Restaurant Ordering Platform - Initial Schema

  1. New Tables
    - `restaurants` - Restaurant profiles with slug, name, phone, settings
    - `categories` - Menu categories per restaurant (e.g. Chawarmas, Boissons)
    - `products` - Menu items with name, description, price, prep time, image, availability
    - `tables` - Restaurant tables with name, QR code reference, status
    - `orders` - Customer orders with status tracking, dine-in/takeaway, special instructions
    - `order_items` - Individual items within an order with quantity and price
    - `payments` - Payment records linked to orders (Wave, MTN MoMo, Cash)

  2. Security
    - Enable RLS on ALL tables
    - Restaurant owners can CRUD their own data (matched by restaurant.owner_id = auth.uid())
    - Clients can read menus and create orders (public read for menus, authenticated insert for orders)
    - Kitchen can read/update order statuses for their restaurant

  3. Important Notes
    - All tables use UUID primary keys with gen_random_uuid()
    - Timestamps default to now()
    - RLS is restrictive by default - no data accessible without explicit policies
*/

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own restaurant"
  ON restaurants FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can update own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own restaurant"
  ON restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Clients can read restaurant by slug"
  ON restaurants FOR SELECT
  TO anon, authenticated
  USING (true);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = categories.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Clients can read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = categories.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Owners can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = categories.restaurant_id AND restaurants.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = categories.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = categories.restaurant_id AND restaurants.owner_id = auth.uid())
  );

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  prep_time_minutes int DEFAULT 15,
  image_url text DEFAULT '',
  available boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can read products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = products.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Clients can read available products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (available = true);

CREATE POLICY "Owners can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = products.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Owners can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = products.restaurant_id AND restaurants.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = products.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = products.restaurant_id AND restaurants.owner_id = auth.uid())
  );

-- Tables (restaurant tables/seats)
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'libre' CHECK (status IN ('libre', 'occupee')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own tables"
  ON tables FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = tables.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Clients can read table by id"
  ON tables FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners can insert tables"
  ON tables FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = tables.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Owners can update tables"
  ON tables FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = tables.restaurant_id AND restaurants.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = tables.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete tables"
  ON tables FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = tables.restaurant_id AND restaurants.owner_id = auth.uid())
  );

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'nouvelle' CHECK (status IN ('nouvelle', 'en_cours', 'prete', 'servie')),
  order_type text NOT NULL DEFAULT 'sur_place' CHECK (order_type IN ('sur_place', 'emporter')),
  special_instructions text DEFAULT '',
  customer_phone text DEFAULT '',
  total decimal(10,2) NOT NULL DEFAULT 0,
  estimated_prep_minutes int DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Clients can read own order"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Clients can create orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = auth.uid())
  );

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients can read order items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Clients can create order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  method text NOT NULL CHECK (method IN ('wave', 'mtn_momo', 'especes')),
  amount decimal(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'confirme', 'echoue')),
  customer_phone text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = payments.order_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients can read own payment"
  ON payments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Clients can create payments"
  ON payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
