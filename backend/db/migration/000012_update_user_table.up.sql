ALTER TABLE "users"
ADD COLUMN store_name varchar(50),
ADD COLUMN confirmed_email boolean DEFAULT false;