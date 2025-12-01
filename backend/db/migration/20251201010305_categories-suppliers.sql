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
