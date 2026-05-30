-- Stock adjustment reason enum
CREATE TYPE stock_adjustment_reason AS ENUM (
    'physical_count',
    'damaged',
    'expired',
    'theft',
    'correction',
    'return',
    'other'
);

-- Stock movement type enum
CREATE TYPE stock_movement_type AS ENUM (
    'sale',
    'purchase',
    'adjustment',
    'return',
    'transfer'
);

-- Stock reference type enum
CREATE TYPE stock_reference_type AS ENUM (
    'sale',
    'purchase_order',
    'adjustment',
    'return'
);

-- Stock adjustments table (audit trail for manual adjustments)
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id), -- optional, for variant-level adjustments
    adjustment_quantity INT NOT NULL, -- positive = add stock, negative = remove stock
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reason stock_adjustment_reason NOT NULL DEFAULT 'correction',
    notes TEXT,
    adjusted_by UUID REFERENCES store_owner(id), -- user who made the adjustment
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table (automatic log of all stock changes)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id), -- optional
    movement_type stock_movement_type NOT NULL,
    quantity_change INT NOT NULL, -- positive = inbound, negative = outbound
    reference_id UUID, -- sale_id, purchase_order_id, adjustment_id, etc.
    reference_type stock_reference_type,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_stock_adjustments_store_id ON stock_adjustments(store_id);
CREATE INDEX idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);

CREATE INDEX idx_stock_movements_store_id ON stock_movements(store_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
