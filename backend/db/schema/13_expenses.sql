CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method VARCHAR(20),
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
