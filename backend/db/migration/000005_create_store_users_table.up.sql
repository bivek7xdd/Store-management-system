-- Create store_users table for multi-user access to stores
CREATE TABLE "store_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" varchar(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  "permissions" jsonb DEFAULT '{}',
  "is_active" boolean NOT NULL DEFAULT true,
  "joined_at" timestamptz DEFAULT (now()),
  UNIQUE(store_id, user_id)
);

-- Create indexes
CREATE INDEX idx_store_users_store ON store_users(store_id);
CREATE INDEX idx_store_users_user ON store_users(user_id);
CREATE INDEX idx_store_users_active ON store_users(is_active);
CREATE INDEX idx_store_users_role ON store_users(store_id, role);
