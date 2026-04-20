CREATE TABLE IF NOT EXISTS payment_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_type sales_types NOT NULL,
  provider VARCHAR(50),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
