-- name: GetInventoryValuation :many
SELECT
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    p.cost_price,
    p.price as selling_price,
    (p.stock_quantity * p.cost_price)::DECIMAL(12,2) as cost_value,
    (p.stock_quantity * p.price)::DECIMAL(12,2) as retail_value,
    ((p.price - p.cost_price) * p.stock_quantity)::DECIMAL(12,2) as potential_profit
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1 AND p.status = 'active'
ORDER BY cost_value DESC;

-- name: GetInventoryValuationSummary :one
SELECT
    COUNT(*) as total_products,
    SUM(stock_quantity)::INT as total_units,
    COALESCE(SUM(stock_quantity * cost_price), 0)::DECIMAL(12,2) as total_cost_value,
    COALESCE(SUM(stock_quantity * price), 0)::DECIMAL(12,2) as total_retail_value,
    COALESCE(SUM((price - cost_price) * stock_quantity), 0)::DECIMAL(12,2) as total_potential_profit
FROM products
WHERE store_id = $1 AND status = 'active';

-- name: GetInventoryValuationByCategory :many
SELECT
    c.id as category_id,
    c.name as category_name,
    COUNT(p.id) as product_count,
    SUM(p.stock_quantity)::INT as total_units,
    COALESCE(SUM(p.stock_quantity * p.cost_price), 0)::DECIMAL(12,2) as total_cost_value,
    COALESCE(SUM(p.stock_quantity * p.price), 0)::DECIMAL(12,2) as total_retail_value
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1 AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY total_cost_value DESC;

-- name: GetLowStockReport :many
SELECT
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    p.low_stock_threshold,
    (p.low_stock_threshold - p.stock_quantity)::INT as units_below_threshold,
    p.cost_price,
    (p.cost_price * (p.low_stock_threshold - p.stock_quantity))::DECIMAL(12,2) as reorder_cost
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1
    AND p.status = 'active'
    AND p.stock_quantity <= p.low_stock_threshold
ORDER BY units_below_threshold DESC;

-- name: GetExpiringProductsReport :many
SELECT
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    p.expires_at,
    p.cost_price,
    (p.stock_quantity * p.cost_price)::DECIMAL(12,2) as capital_at_risk,
    EXTRACT(DAY FROM (p.expires_at - NOW()))::INT as days_until_expiry
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1
    AND p.status IN ('active', 'expiring')
    AND p.expires_at IS NOT NULL
    AND p.expires_at <= NOW() + INTERVAL '30 days'
ORDER BY p.expires_at ASC;
