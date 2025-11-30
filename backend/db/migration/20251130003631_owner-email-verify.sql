-- Modify "store_owner" table
ALTER TABLE "public"."store_owner" ADD COLUMN "emailverified" boolean NOT NULL DEFAULT false;
