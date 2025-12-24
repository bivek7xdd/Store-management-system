-- Create "sale_items" table
CREATE TABLE "public"."sale_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "sale_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" numeric(10,2) NOT NULL,
  "total_price" numeric(10,2) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
