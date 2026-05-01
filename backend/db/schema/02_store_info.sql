CREATE TABLE IF NOT EXISTS store_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'NPR',
    owner_id UUID NOT NULL REFERENCES store_owner(id) ON DELETE CASCADE,
    loyalty_progress_target INT NOT NULL DEFAULT 5,
    loyalty_discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);