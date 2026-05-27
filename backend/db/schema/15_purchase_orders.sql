CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_delivery_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    notes TEXT,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    product_id UUID,
    product_name VARCHAR(150) NOT NULL,
    ordered_quantity INT NOT NULL DEFAULT 0,
    received_quantity INT NOT NULL DEFAULT 0,
    damaged_quantity INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
