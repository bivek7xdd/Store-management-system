CREATE TYPE sales_types as ENUM(
    'cash', 'credit', 'online', 'mixed'
);

CREATE TABLE IF NOT EXISTS sales(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_type sales_types NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(10,2),
    receipt_url VARCHAR(255),
    sale_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE
);