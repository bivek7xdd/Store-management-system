-- Create stock_changes table (audit log for inventory changes)
CREATE TABLE "stock_changes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "change_type" varchar(20) NOT NULL CHECK (change_type IN ('restock', 'sale', 'return', 'spoiled', 'adjustment')),
  "quantity" integer NOT NULL,
  "previous_quantity" integer NOT NULL,
  "new_quantity" integer NOT NULL,
  "change_date" timestamptz DEFAULT (now()),
  "notes" text
);

-- Create indexes
CREATE INDEX idx_stock_changes_product ON stock_changes(product_id);
CREATE INDEX idx_stock_changes_user ON stock_changes(user_id);
CREATE INDEX idx_stock_changes_type ON stock_changes(change_type);
CREATE INDEX idx_stock_changes_date ON stock_changes(change_date);
CREATE INDEX idx_stock_changes_product_date ON stock_changes(product_id, change_date);
