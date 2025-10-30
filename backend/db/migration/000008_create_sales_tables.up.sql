-- Create sales table
CREATE TABLE "sales" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
  "sale_type" varchar(20) NOT NULL CHECK (sale_type IN ('cash', 'credit', 'card', 'mobile_money')),
  "total_amount" decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  "discount_applied" decimal(10,2) DEFAULT 0 CHECK (discount_applied >= 0),
  "tax_amount" decimal(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  "final_amount" decimal(10,2) NOT NULL CHECK (final_amount >= 0),
  "sale_date" timestamptz DEFAULT (now()),
  "receipt_number" varchar(50),
  "receipt_url" varchar(255),
  "notes" text,
  "created_at" timestamptz DEFAULT (now())
);

-- Create sale_items table
CREATE TABLE "sale_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sale_id" uuid NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "product_name" varchar(100) NOT NULL,
  "quantity" integer NOT NULL CHECK (quantity > 0),
  "unit_price" decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  "subtotal" decimal(10,2) NOT NULL CHECK (subtotal >= 0),
  "discount" decimal(10,2) DEFAULT 0 CHECK (discount >= 0)
);

-- Create indexes for sales
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_store_date ON sales(store_id, sale_date);
CREATE INDEX idx_sales_store_type ON sales(store_id, sale_type);
CREATE INDEX idx_sales_receipt ON sales(receipt_number);

-- Create indexes for sale_items
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
