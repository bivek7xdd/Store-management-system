-- name: GetTotalSales :one
SELECT 
    COALESCE(SUM(total_amount), 0.0)::DECIMAL(12,2) as total_sales,
    COUNT(*) as sales_count
FROM sales
WHERE store_id = $1 AND sale_date BETWEEN $2 AND $3;

-- name: GetSalesByType :many
SELECT 
    sales_type,
    COALESCE(SUM(total_amount), 0.0)::DECIMAL(12,2) as total_amount,
    COUNT(*) as count
FROM sales
WHERE store_id = $1 AND sale_date BETWEEN $2 AND $3
GROUP BY sales_type;

-- name: GetInventoryStats :one
SELECT 
    COUNT(*) as total_products,
    COALESCE(SUM(stock_quantity * COALESCE(market_price, price)), 0.0)::DECIMAL(12,2) as total_value,
    COUNT(*) FILTER (WHERE stock_quantity < low_stock_threshold) as low_stock_count
FROM products
WHERE store_id = $1 AND status = 'active';

-- name: GetDebtsStats :one
SELECT 
    COALESCE(SUM(amount_owed - amount_paid), 0.0)::DECIMAL(12,2) as total_outstanding,
    COUNT(DISTINCT customer_id) as total_debtors
FROM debts
WHERE store_id = $1 AND amount_owed > amount_paid;

-- name: GetRecentSales :many
SELECT 
    s.id,
    s.total_amount,
    s.sales_type,
    s.sale_date,
    c.name as customer_name
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.store_id = $1
ORDER BY s.sale_date DESC
LIMIT $2;

-- name: GetTopDebtors :many
SELECT 
    c.name as customer_name,
    c.phone as customer_phone,
    SUM(d.amount_owed - d.amount_paid)::DECIMAL(12,2) as total_debt,
    MAX(d.updated_at) as last_transaction
FROM debts d
JOIN customers c ON d.customer_id = c.id
WHERE d.store_id = $1 AND d.amount_owed > d.amount_paid
GROUP BY c.id, c.name, c.phone
ORDER BY total_debt DESC
LIMIT $2;

-- name: GetDailySales :many
SELECT 
    DATE(sale_date)::VARCHAR as sale_date,
    COALESCE(SUM(total_amount), 0.0)::DECIMAL(12,2) as daily_total
FROM sales
WHERE store_id = $1 AND sale_date BETWEEN $2 AND $3
GROUP BY DATE(sale_date)
ORDER BY DATE(sale_date);

-- name: GetTopSellingProducts :many
SELECT 
    p.name as product_name,
    SUM(si.quantity)::BIGINT as total_quantity
FROM sale_items si
JOIN products p ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
WHERE s.store_id = $1 AND s.sale_date BETWEEN $2 AND $3
GROUP BY p.id, p.name
ORDER BY total_quantity DESC
LIMIT $4;

-- name: GetStockByCategory :many
SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1 AND p.status = 'active'
GROUP BY c.id, c.name;

-- name: GetRevenueByCategory :many
SELECT 
    c.name as category_name,
    COALESCE(SUM(si.total_price), 0.0)::DECIMAL(12,2) as total_revenue
FROM sale_items si
JOIN products p ON si.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN sales s ON si.sale_id = s.id
WHERE s.store_id = $1 AND s.sale_date BETWEEN $2 AND $3
GROUP BY c.id, c.name
ORDER BY total_revenue DESC;

-- name: GetSalesForPeriod :one
SELECT 
    COALESCE(SUM(total_amount), 0.0)::DECIMAL(12,2) as total_sales
FROM sales
WHERE store_id = $1 AND sale_date BETWEEN $2 AND $3;

-- name: GetInactiveProducts :many
SELECT 
    p.name as product_name,
    p.stock_quantity,
    p.price,
    (p.stock_quantity * p.price)::DECIMAL(12,2) as potential_revenue,
    MAX(s.sale_date) as last_sold_at
FROM products p
LEFT JOIN sale_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id
WHERE 
    p.store_id = $1 
    AND p.stock_quantity > 0 
    AND p.status = 'active'
GROUP BY p.id, p.name, p.stock_quantity, p.price
HAVING 
    MAX(s.sale_date) < NOW() - INTERVAL '30 days' 
    OR MAX(s.sale_date) IS NULL
ORDER BY potential_revenue DESC
LIMIT $2;
