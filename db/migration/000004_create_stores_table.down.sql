-- Drop trigger
DROP TRIGGER IF EXISTS trigger_stores_updated_at ON stores;

-- Drop indexes
DROP INDEX IF EXISTS idx_stores_slug;
DROP INDEX IF EXISTS idx_stores_active;
DROP INDEX IF EXISTS idx_stores_owner;

-- Drop table
DROP TABLE IF EXISTS stores;
