-- +goose Up

CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    quantity INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_product_batch UNIQUE (product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry ON product_batches(expiry_date);

-- +goose Down

DROP INDEX IF EXISTS idx_product_batches_expiry;
DROP INDEX IF EXISTS idx_product_batches_product_id;
DROP TABLE IF EXISTS product_batches;
