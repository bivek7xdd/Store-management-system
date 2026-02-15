-- Modify "products" table
ALTER TABLE "public"."products" ADD COLUMN "cost_price" numeric(10,2) NOT NULL DEFAULT 0;
