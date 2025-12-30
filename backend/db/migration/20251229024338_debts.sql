-- Create enum type "debt_status"
CREATE TYPE "public"."debt_status" AS ENUM ('paid', 'pending', 'partial', 'written-off');
-- Create "debts" table
CREATE TABLE "public"."debts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL,
  "customer_id" uuid NULL,
  "sale_id" uuid NULL,
  "amount_owed" numeric(12,2) NOT NULL,
  "amount_paid" numeric(12,2) NOT NULL DEFAULT 0.00,
  "due_date" timestamptz NOT NULL,
  "status" "public"."debt_status" NOT NULL DEFAULT 'pending',
  "notes" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "debts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "debts_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "debts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "amount_paid_check" CHECK (amount_paid <= amount_owed)
);
-- Create index "idx_debts_customer_id" to table: "debts"
CREATE INDEX "idx_debts_customer_id" ON "public"."debts" ("customer_id");
-- Create index "idx_debts_due_date" to table: "debts"
CREATE INDEX "idx_debts_due_date" ON "public"."debts" ("due_date");
-- Create index "idx_debts_status" to table: "debts"
CREATE INDEX "idx_debts_status" ON "public"."debts" ("status");
-- Create index "idx_debts_store_id" to table: "debts"
CREATE INDEX "idx_debts_store_id" ON "public"."debts" ("store_id");
