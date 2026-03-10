-- Notification types enum
CREATE TYPE notification_type AS ENUM ('debt_due', 'low_stock', 'expiring_product', 'system');

-- Notification status enum
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'dismissed');

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID, -- Can reference debt_id, product_id, etc.
    reference_type VARCHAR(50), -- 'debt', 'product', etc.
    status notification_status NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(store_id, status) WHERE status = 'unread';
