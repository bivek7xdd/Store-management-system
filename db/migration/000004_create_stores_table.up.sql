-- Create stores table
CREATE TABLE "stores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) UNIQUE NOT NULL,
  "business_type" varchar(50),
  "description" text,
  "address" varchar(255),
  "phone" varchar(20),
  "email" varchar(100),
  "tax_id" varchar(50),
  "logo_url" varchar(255),
  "currency" varchar(3) DEFAULT 'USD',
  "timezone" varchar(50) DEFAULT 'UTC',
  "is_active" boolean NOT NULL DEFAULT true,
  "subscription_plan" varchar(50) DEFAULT 'free',
  "subscription_expires_at" timestamptz,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

-- Create indexes
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_active ON stores(is_active);
CREATE INDEX idx_stores_slug ON stores(slug);

-- Add trigger for updated_at
CREATE TRIGGER trigger_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
