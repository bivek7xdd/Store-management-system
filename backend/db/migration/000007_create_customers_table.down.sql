-- Drop trigger
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;

-- Drop indexes
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_customers_phone;
DROP INDEX IF EXISTS idx_customers_store_active;
DROP INDEX IF EXISTS idx_customers_store;

-- Drop table
DROP TABLE IF EXISTS customers;
