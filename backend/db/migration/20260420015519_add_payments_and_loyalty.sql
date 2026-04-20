-- Create enum type "loyalty_status"
CREATE TYPE "public"."loyalty_status" AS ENUM ('regular', 'loyal', 'vip');
-- Modify "customers" table
ALTER TABLE "public"."customers" ADD COLUMN "loyalty_status" "public"."loyalty_status" NOT NULL DEFAULT 'regular', ADD COLUMN "purchase_count" integer NOT NULL DEFAULT 0, ADD COLUMN "loyalty_points" integer NOT NULL DEFAULT 0, ADD COLUMN "last_purchase_at" timestamptz NULL;
-- Create "payment_records" table
CREATE TABLE "public"."payment_records" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "sale_id" uuid NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "payment_type" "public"."sales_types" NOT NULL,
  "provider" character varying(50) NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "payment_records_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
