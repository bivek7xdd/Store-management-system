-- Modify "store_owner" table
ALTER TABLE "public"."store_owner" ADD COLUMN "otp" character varying(7) NOT NULL DEFAULT '';
