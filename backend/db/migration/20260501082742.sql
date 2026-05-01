-- Modify "store_info" table
ALTER TABLE "public"."store_info" ADD COLUMN "loyalty_progress_target" integer NOT NULL DEFAULT 5, ADD COLUMN "loyalty_discount_percentage" numeric(5,2) NOT NULL DEFAULT 10.00;
