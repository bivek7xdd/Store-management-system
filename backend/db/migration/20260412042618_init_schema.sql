-- Create enum type "product_status"
CREATE TYPE "public"."product_status" AS ENUM ('active', 'out_of_stock', 'discontinued', 'expiring');
-- Create enum type "sales_types"
CREATE TYPE "public"."sales_types" AS ENUM ('cash', 'credit', 'online');
-- Create enum type "debt_status"
CREATE TYPE "public"."debt_status" AS ENUM ('paid', 'pending', 'partial', 'written-off');
-- Create enum type "notification_type"
CREATE TYPE "public"."notification_type" AS ENUM ('debt_due', 'low_stock', 'expiring_product', 'system');
-- Create enum type "notification_status"
CREATE TYPE "public"."notification_status" AS ENUM ('unread', 'read', 'dismissed');
-- Create "store_owner" table
CREATE TABLE "public"."store_owner" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(255) NOT NULL,
  "email" character varying(255) NOT NULL,
  "password" character varying(255) NOT NULL,
  "emailverified" boolean NOT NULL DEFAULT false,
  "phone" character varying(20) NOT NULL,
  "role" character varying(50) NOT NULL DEFAULT 'owner',
  "profile_picture" character varying(255) NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "store_owner_email_key" UNIQUE ("email")
);
-- Create "otp_tokens" table
CREATE TABLE "public"."otp_tokens" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_email" character varying(50) NOT NULL,
  "otp" character varying(6) NOT NULL,
  "purpose" character varying(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" timestamptz NOT NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_otp_tokens_expires_at" to table: "otp_tokens"
CREATE INDEX "idx_otp_tokens_expires_at" ON "public"."otp_tokens" ("expires_at");
-- Create index "idx_otp_tokens_user_id" to table: "otp_tokens"
CREATE INDEX "idx_otp_tokens_user_id" ON "public"."otp_tokens" ("user_email");
-- Create "store_info" table
CREATE TABLE "public"."store_info" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "address" text NOT NULL,
  "currency_code" character varying(3) NOT NULL DEFAULT 'NPR',
  "owner_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "store_info_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."store_owner" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "categories" table
CREATE TABLE "public"."categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(50) NOT NULL,
  "description" text NULL,
  "store_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "customers" table
CREATE TABLE "public"."customers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(100) NOT NULL,
  "phone" character varying(20) NOT NULL,
  "created_at" timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
  "store_id" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
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
-- Create "notifications" table
CREATE TABLE "public"."notifications" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL,
  "type" "public"."notification_type" NOT NULL,
  "title" character varying(255) NOT NULL,
  "message" text NOT NULL,
  "reference_id" uuid NULL,
  "reference_type" character varying(50) NULL,
  "status" "public"."notification_status" NOT NULL DEFAULT 'unread',
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "notifications_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_notifications_created_at" to table: "notifications"
CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" ("created_at" DESC);
-- Create index "idx_notifications_status" to table: "notifications"
CREATE INDEX "idx_notifications_status" ON "public"."notifications" ("status");
-- Create index "idx_notifications_store_id" to table: "notifications"
CREATE INDEX "idx_notifications_store_id" ON "public"."notifications" ("store_id");
-- Create index "idx_notifications_type" to table: "notifications"
CREATE INDEX "idx_notifications_type" ON "public"."notifications" ("type");
-- Create index "idx_notifications_unread" to table: "notifications"
CREATE INDEX "idx_notifications_unread" ON "public"."notifications" ("store_id", "status") WHERE (status = 'unread'::public.notification_status);
-- Create "suppliers" table
CREATE TABLE "public"."suppliers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(50) NULL,
  "address" character varying(100) NULL,
  "phone_number" character varying(20) NULL,
  "email" character varying(50) NULL,
  "store_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "suppliers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "products" table
CREATE TABLE "public"."products" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(150) NOT NULL,
  "barcode" character varying(50) NULL,
  "price" numeric(10,2) NOT NULL,
  "cost_price" numeric(10,2) NOT NULL DEFAULT 0,
  "market_price" numeric(10,2) NULL,
  "stock_quantity" integer NOT NULL DEFAULT 0,
  "low_stock_threshold" integer NULL DEFAULT 10,
  "expires_at" timestamptz NULL,
  "status" "public"."product_status" NULL DEFAULT 'active',
  "category_id" uuid NOT NULL,
  "supplier_id" uuid NULL,
  "store_id" uuid NOT NULL,
  "image_url" character varying(255) NULL,
  "is_tracked" boolean NULL DEFAULT false,
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
CREATE INDEX "idx_products_name_trgm" ON "public"."products" USING GIN ("name" public.gin_trgm_ops);
-- Create index "idx_products_store_id" to table: "products"
CREATE INDEX "idx_products_store_id" ON "public"."products" ("store_id");
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
