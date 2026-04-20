CREATE TYPE loyalty_status AS ENUM ('regular', 'loyal', 'vip');

CREATE TABLE IF NOT EXISTS customers(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    loyalty_status loyalty_status NOT NULL DEFAULT 'regular',
    purchase_count integer NOT NULL DEFAULT 0,
    loyalty_points integer NOT NULL DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    store_id UUID REFERENCES store_info(id) ON DELETE CASCADE
)