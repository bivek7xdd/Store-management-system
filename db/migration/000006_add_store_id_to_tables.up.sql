-- Add store_id to categories table
ALTER TABLE categories ADD COLUMN store_id uuid;

-- Add store_id to suppliers table
ALTER TABLE suppliers ADD COLUMN store_id uuid;

-- Add store_id to products table
ALTER TABLE products ADD COLUMN store_id uuid;

-- Add foreign key constraints
ALTER TABLE categories ADD CONSTRAINT fk_categories_store 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_store 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE products ADD CONSTRAINT fk_products_store 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_categories_store ON categories(store_id);
CREATE INDEX idx_categories_store_active ON categories(store_id, is_active);

CREATE INDEX idx_suppliers_store ON suppliers(store_id);
CREATE INDEX idx_suppliers_store_active ON suppliers(store_id, is_active);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_store_active ON products(store_id, is_active);
CREATE INDEX idx_products_store_code ON products(store_id, code);

-- Update unique constraints to be store-specific
-- Drop old unique constraints
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_slug_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_code_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_key;

-- Add new store-specific unique constraints
ALTER TABLE categories ADD CONSTRAINT categories_store_name_unique UNIQUE (store_id, name);
ALTER TABLE categories ADD CONSTRAINT categories_store_slug_unique UNIQUE (store_id, slug);
ALTER TABLE suppliers ADD CONSTRAINT suppliers_store_slug_unique UNIQUE (store_id, slug);
ALTER TABLE products ADD CONSTRAINT products_store_code_unique UNIQUE (store_id, code);
ALTER TABLE products ADD CONSTRAINT products_store_slug_unique UNIQUE (store_id, slug);
