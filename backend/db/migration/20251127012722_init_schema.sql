-- Create "store_owner" table
CREATE TABLE "public"."store_owner" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(255) NOT NULL,
  "email" character varying(255) NOT NULL,
  "password" character varying(255) NOT NULL,
  "phone" character varying(20) NOT NULL,
  "role" character varying(50) NOT NULL DEFAULT 'owner',
  "profile_picture" character varying(255) NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "store_owner_email_key" UNIQUE ("email")
);
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
