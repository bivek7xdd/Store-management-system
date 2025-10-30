-- Drop store-specific unique constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_store_slug_unique;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_store_code_unique;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_store_slug_unique;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_store_slug_unique;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_store_name_unique;

-- Restore old unique constraints
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE suppliers ADD CONSTRAINT suppliers_slug_key UNIQUE (slug);
ALTER TABLE products ADD CONSTRAINT products_code_key UNIQUE (code);
ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE (slug);

-- Drop indexes
DROP INDEX IF EXISTS idx_products_store_code;
DROP INDEX IF EXISTS idx_products_store_active;
DROP INDEX IF EXISTS idx_products_store;

DROP INDEX IF EXISTS idx_suppliers_store_active;
DROP INDEX IF EXISTS idx_suppliers_store;

DROP INDEX IF EXISTS idx_categories_store_active;
DROP INDEX IF EXISTS idx_categories_store;

-- Drop foreign key constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_store;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS fk_suppliers_store;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_store;

-- Remove store_id columns
ALTER TABLE products DROP COLUMN IF EXISTS store_id;
ALTER TABLE suppliers DROP COLUMN IF EXISTS store_id;
ALTER TABLE categories DROP COLUMN IF EXISTS store_id;
