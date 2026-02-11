-- Modify "products" table
ALTER TABLE "public"."products" ADD COLUMN "is_tracked" boolean NULL DEFAULT false;
