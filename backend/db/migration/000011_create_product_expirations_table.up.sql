-- Create product_expirations table (for perishable products)
CREATE TABLE "product_expirations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "batch_number" varchar(50),
  "expiration_date" date NOT NULL,
  "quantity" integer NOT NULL CHECK (quantity >= 0),
  "created_at" timestamptz DEFAULT (now())
);

-- Create indexes
CREATE INDEX idx_product_expirations_product ON product_expirations(product_id);
CREATE INDEX idx_product_expirations_date ON product_expirations(expiration_date);
CREATE INDEX idx_product_expirations_product_date ON product_expirations(product_id, expiration_date);
CREATE INDEX idx_product_expirations_batch ON product_expirations(batch_number);
