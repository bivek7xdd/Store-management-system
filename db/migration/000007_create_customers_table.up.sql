-- Create customers table
CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "phone" varchar(20),
  "email" varchar(100),
  "address" varchar(255),
  "notification_token" varchar(255),
  "total_purchases" decimal(10,2) DEFAULT 0 CHECK (total_purchases >= 0),
  "total_debt" decimal(10,2) DEFAULT 0 CHECK (total_debt >= 0),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now()),
  CONSTRAINT customers_store_phone_unique UNIQUE (store_id, phone)
);

-- Create indexes
CREATE INDEX idx_customers_store ON customers(store_id);
CREATE INDEX idx_customers_store_active ON customers(store_id, is_active);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Add trigger for updated_at
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
