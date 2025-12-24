-- Modify "customers" table
ALTER TABLE "public"."customers" ADD COLUMN "store_id" uuid NULL, ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store_info" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
