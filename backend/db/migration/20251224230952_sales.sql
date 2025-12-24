-- Create enum type "sales_types"
CREATE TYPE "public"."sales_types" AS ENUM ('cash', 'credit', 'online');
-- Create "customers" table
CREATE TABLE "public"."customers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(100) NOT NULL,
  "phone" character varying(20) NOT NULL,
  "created_at" timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
-- Create "sales" table
CREATE TABLE "public"."sales" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "sales_type" "public"."sales_types" NOT NULL,
  "total_amount" numeric(10,2) NOT NULL,
  "discount_applied" numeric(10,2) NULL,
  "receipt_url" character varying(255) NULL,
  "sale_date" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "store_id" uuid NOT NULL,
  "customer_id" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "sales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
