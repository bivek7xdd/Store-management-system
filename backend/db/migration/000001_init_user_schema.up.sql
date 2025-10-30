CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "email" varchar(254) UNIQUE NOT NULL,
  "password" varchar(500) NOT NULL,
  "phone" varchar(50),
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "email_verified" boolean NOT NULL DEFAULT false,
  "last_login" timestamptz,
  "failed_login_attempts" integer NOT NULL DEFAULT 0,
  "locked_until" timestamptz,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE INDEX ON "users" ("status", "email_verified");
