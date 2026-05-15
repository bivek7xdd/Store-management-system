CREATE TABLE IF NOT EXISTS supplier_payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    description TEXT,
    amount_owed DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_payables_store_id ON supplier_payables(store_id);
CREATE INDEX idx_supplier_payables_supplier_id ON supplier_payables(supplier_id);
CREATE INDEX idx_supplier_payables_status ON supplier_payables(status);
CREATE INDEX idx_supplier_payables_due_date ON supplier_payables(due_date);
