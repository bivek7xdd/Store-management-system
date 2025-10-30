-- Drop indexes for sale_items
DROP INDEX IF EXISTS idx_sale_items_product;
DROP INDEX IF EXISTS idx_sale_items_sale;

-- Drop indexes for sales
DROP INDEX IF EXISTS idx_sales_receipt;
DROP INDEX IF EXISTS idx_sales_store_type;
DROP INDEX IF EXISTS idx_sales_store_date;
DROP INDEX IF EXISTS idx_sales_user;
DROP INDEX IF EXISTS idx_sales_customer;
DROP INDEX IF EXISTS idx_sales_store;

-- Drop tables
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
