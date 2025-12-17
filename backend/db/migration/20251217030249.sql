-- Create extension for trigram support
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create enum type "product_status"
CREATE TYPE "public"."product_status" AS ENUM ('active', 'out_of_stock', 'discontinued');
-- Create "products" table
CREATE TABLE "public"."products" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(150) NOT NULL,
  "barcode" character varying(50) NULL,
  "price" numeric(10,2) NOT NULL,
  "market_price" numeric(10,2) NULL,
  "stock_quantity" integer NOT NULL DEFAULT 0,
  "low_stock_threshold" integer NULL DEFAULT 10,
  "expires_at" timestamptz NULL,
  "status" "public"."product_status" NULL DEFAULT 'active',
  "category_id" uuid NOT NULL,
  "supplier_id" uuid NULL,
  "store_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "unique_store_barcode" UNIQUE ("store_id", "barcode"),
  CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_products_category_id" to table: "products"
CREATE INDEX "idx_products_category_id" ON "public"."products" ("category_id");
-- Create index "idx_products_name_trgm" to table: "products"
CREATE INDEX "idx_products_name_trgm" ON "public"."products" USING gin ("name" public.gin_trgm_ops);
-- Create index "idx_products_store_id" to table: "products"
CREATE INDEX "idx_products_store_id" ON "public"."products" ("store_id");
