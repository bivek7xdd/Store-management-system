-- Drop indexes
DROP INDEX IF EXISTS idx_product_expirations_batch;
DROP INDEX IF EXISTS idx_product_expirations_product_date;
DROP INDEX IF EXISTS idx_product_expirations_date;
DROP INDEX IF EXISTS idx_product_expirations_product;

-- Drop table
DROP TABLE IF EXISTS product_expirations;
