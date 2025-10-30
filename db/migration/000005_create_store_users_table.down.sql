-- Drop indexes
DROP INDEX IF EXISTS idx_store_users_role;
DROP INDEX IF EXISTS idx_store_users_active;
DROP INDEX IF EXISTS idx_store_users_user;
DROP INDEX IF EXISTS idx_store_users_store;

-- Drop table
DROP TABLE IF EXISTS store_users;
