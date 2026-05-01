-- Modify "product_variants" table
ALTER TABLE "public"."product_variants" ADD COLUMN "barcode" character varying(50) NULL, ADD CONSTRAINT "unique_product_variant_barcode" UNIQUE ("barcode");
