-- Drop index "idx_otp_tokens_user_id" from table: "otp_tokens"
DROP INDEX "public"."idx_otp_tokens_user_id";
-- Modify "otp_tokens" table
ALTER TABLE "public"."otp_tokens" DROP COLUMN "user_id", ADD COLUMN "user_email" character varying(50) NOT NULL;
-- Create index "idx_otp_tokens_user_id" to table: "otp_tokens"
CREATE INDEX "idx_otp_tokens_user_id" ON "public"."otp_tokens" ("user_email");
