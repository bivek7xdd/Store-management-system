-- Create "product_variants" table
CREATE TABLE "public"."product_variants" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "sku" character varying(50) NOT NULL,
  "attributes" jsonb NOT NULL DEFAULT '{}',
  "cost_price" numeric(10,2) NOT NULL DEFAULT 0,
  "selling_price" numeric(10,2) NOT NULL,
  "stock_level" integer NOT NULL DEFAULT 0,
  "image_url" character varying(255) NULL,
  "archived_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "unique_product_sku" UNIQUE ("product_id", "sku"),
  CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_product_variants_attributes" to table: "product_variants"
CREATE INDEX "idx_product_variants_attributes" ON "public"."product_variants" USING GIN ("attributes");
-- Create index "idx_product_variants_product_id" to table: "product_variants"
CREATE INDEX "idx_product_variants_product_id" ON "public"."product_variants" ("product_id");
-- Create index "idx_product_variants_sku" to table: "product_variants"
CREATE INDEX "idx_product_variants_sku" ON "public"."product_variants" ("sku");
-- Modify "sale_items" table
ALTER TABLE "public"."sale_items" ADD COLUMN "variant_id" uuid NULL, ADD CONSTRAINT "sale_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
