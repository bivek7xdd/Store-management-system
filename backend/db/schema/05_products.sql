

CREATE TYPE product_status AS ENUM ('active', 'out_of_stock', 'discontinued', 'expiring');

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    barcode VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    market_price DECIMAL(10, 2),
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    damaged_quantity INT NOT NULL DEFAULT 0,
    warranty_days INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    status product_status DEFAULT 'active',
    category_id UUID NOT NULL REFERENCES categories(id),
    supplier_id UUID REFERENCES suppliers(id),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    image_url VARCHAR(255),
    is_tracked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_store_barcode UNIQUE (store_id, barcode)
);

CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_category_id ON products(category_id);