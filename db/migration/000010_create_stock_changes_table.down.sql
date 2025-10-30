-- Drop indexes
DROP INDEX IF EXISTS idx_stock_changes_product_date;
DROP INDEX IF EXISTS idx_stock_changes_date;
DROP INDEX IF EXISTS idx_stock_changes_type;
DROP INDEX IF EXISTS idx_stock_changes_user;
DROP INDEX IF EXISTS idx_stock_changes_product;

-- Drop table
DROP TABLE IF EXISTS stock_changes;
