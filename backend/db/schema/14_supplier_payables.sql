CREATE TABLE IF NOT EXISTS supplier_payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    description TEXT,
    amount_owed DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    purchase_order_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    payable_id UUID NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
