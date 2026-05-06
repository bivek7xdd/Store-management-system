-- Create return tables and alter product tables for damaged/warranty

ALTER TABLE "public"."products"
  ADD COLUMN "damaged_quantity" integer NOT NULL DEFAULT 0,
  ADD COLUMN "warranty_days" integer DEFAULT 0;

ALTER TABLE "public"."product_variants"
  ADD COLUMN "damaged_stock_level" integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "public"."returns"(
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sale_id" UUID NOT NULL REFERENCES "public"."sales"("id") ON DELETE CASCADE,
    "store_id" UUID NOT NULL REFERENCES "public"."store_info"("id") ON DELETE CASCADE,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "refund_method" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."return_items"(
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "return_id" UUID NOT NULL REFERENCES "public"."returns"("id") ON DELETE CASCADE,
    "sale_item_id" UUID NOT NULL REFERENCES "public"."sale_items"("id"),
    "quantity" INT NOT NULL,
    "reason" VARCHAR(50) NOT NULL,
    "condition" VARCHAR(50) NOT NULL
);
