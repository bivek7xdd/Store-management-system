CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    payable_id UUID NOT NULL REFERENCES supplier_payables(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_payments_store_id ON supplier_payments(store_id);
CREATE INDEX idx_supplier_payments_payable_id ON supplier_payments(payable_id);
CREATE INDEX idx_supplier_payments_date ON supplier_payments(payment_date);
