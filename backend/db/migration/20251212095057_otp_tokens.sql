-- Modify "store_owner" table
ALTER TABLE "public"."store_owner" DROP COLUMN "otp";
-- Create "otp_tokens" table
CREATE TABLE "public"."otp_tokens" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "otp" character varying(6) NOT NULL,
  "purpose" character varying(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" timestamptz NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "otp_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."store_owner" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_otp_tokens_expires_at" to table: "otp_tokens"
CREATE INDEX "idx_otp_tokens_expires_at" ON "public"."otp_tokens" ("expires_at");
-- Create index "idx_otp_tokens_user_id" to table: "otp_tokens"
CREATE INDEX "idx_otp_tokens_user_id" ON "public"."otp_tokens" ("user_id");
