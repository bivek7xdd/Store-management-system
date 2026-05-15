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

-- name: GetSalesInRange :many
SELECT 
    s.id,
    s.total_amount,
    s.sales_type,
    s.sale_date,
    c.name as customer_name
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.store_id = $1 AND s.sale_date BETWEEN $2 AND $3
ORDER BY s.sale_date DESC;

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
    p.id as product_id,
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

-- name: GetProfitStats :one
SELECT 
    COALESCE(SUM(si.total_price), 0.0)::DECIMAL(12,2) as total_revenue,
    COALESCE(SUM(si.quantity * p.cost_price), 0.0)::DECIMAL(12,2) as total_cost,
    (COALESCE(SUM(si.total_price), 0.0) - COALESCE(SUM(si.quantity * p.cost_price), 0.0))::DECIMAL(12,2) as gross_profit
FROM sale_items si
JOIN products p ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
WHERE s.store_id = $1 AND s.sale_date BETWEEN $2 AND $3;

-- name: GetDeadStock :many
SELECT 
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    p.cost_price,
    (p.stock_quantity * p.cost_price)::DECIMAL(12,2) as capital_tied_up,
    COALESCE(EXTRACT(DAY FROM (NOW() - COALESCE(MAX(s.sale_date), p.created_at))), 0)::INT as days_since_last_sale
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sale_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id
WHERE 
    p.store_id = $1 
    AND p.stock_quantity > 0 
    AND p.status = 'active'
GROUP BY p.id, p.name, c.name, p.stock_quantity, p.cost_price, p.created_at
HAVING 
    MAX(s.sale_date) <= NOW() - ($2::int * INTERVAL '1 day')
    OR (MAX(s.sale_date) IS NULL AND p.created_at <= NOW() - ($2::int * INTERVAL '1 day'))
ORDER BY capital_tied_up DESC;

-- name: GetProductVelocity :many
WITH product_sales AS (
    SELECT 
        si.product_id,
        COALESCE(SUM(si.quantity), 0) as total_sold_30d
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.store_id = $1 AND s.sale_date >= NOW() - INTERVAL '30 days'
    GROUP BY si.product_id
)
SELECT 
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    (ps.total_sold_30d / 30.0)::DECIMAL(10,2) as avg_daily_sales,
    CASE 
        WHEN ps.total_sold_30d > 0 THEN 
            CAST(p.stock_quantity / (ps.total_sold_30d / 30.0) AS INT)
        ELSE 9999 
    END as estimated_days_to_stockout
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
JOIN product_sales ps ON p.id = ps.product_id
WHERE 
    p.store_id = $1 
    AND p.status = 'active'
    AND ps.total_sold_30d > 0
ORDER BY estimated_days_to_stockout ASC
LIMIT 50;

-- name: GetProductPairFrequency :many
WITH order_pairs AS (
    SELECT 
        si1.product_id as product_a_id,
        si2.product_id as product_b_id,
        s.id as sale_id
    FROM sale_items si1
    JOIN sale_items si2 ON si1.sale_id = si2.sale_id AND si1.product_id < si2.product_id
    JOIN sales s ON si1.sale_id = s.id
    WHERE s.store_id = $1 AND s.sale_date >= NOW() - INTERVAL '90 days'
)
SELECT 
    pa.name as product_a_name,
    pb.name as product_b_name,
    COUNT(op.sale_id) as pair_frequency
FROM order_pairs op
JOIN products pa ON op.product_a_id = pa.id
JOIN products pb ON op.product_b_id = pb.id
GROUP BY op.product_a_id, op.product_b_id, pa.name, pb.name
ORDER BY pair_frequency DESC
LIMIT 5;

-- name: GetHourlyTransactionHeatmap :many
SELECT 
    EXTRACT(ISODOW FROM sale_date AT TIME ZONE 'Asia/Kathmandu')::INT as day_of_week, 
    EXTRACT(HOUR FROM sale_date AT TIME ZONE 'Asia/Kathmandu')::INT as hour_of_day,
    COUNT(*) as transaction_count
FROM sales
WHERE store_id = $1 AND sale_date >= NOW() - INTERVAL '30 days'
GROUP BY 
    EXTRACT(ISODOW FROM sale_date AT TIME ZONE 'Asia/Kathmandu'), 
    EXTRACT(HOUR FROM sale_date AT TIME ZONE 'Asia/Kathmandu')
ORDER BY day_of_week, hour_of_day;

-- name: GetCashFlowDaily :many
WITH sales_inflow AS (
    SELECT 
        DATE(s.sale_date)::VARCHAR as date,
        COALESCE(SUM(s.total_amount), 0)::DECIMAL(12,2) as amount
    FROM sales s
    WHERE s.store_id = $1 AND s.sale_date BETWEEN $2 AND $3
    GROUP BY DATE(s.sale_date)
),
expense_outflow AS (
    SELECT 
        DATE(e.expense_date)::VARCHAR as date,
        COALESCE(SUM(e.amount), 0)::DECIMAL(12,2) as amount
    FROM expenses e
    WHERE e.store_id = $1 AND e.expense_date BETWEEN $2 AND $3
    GROUP BY DATE(e.expense_date)
),
refund_outflow AS (
    SELECT 
        DATE(r.created_at)::VARCHAR as date,
        COALESCE(SUM(r.refund_amount), 0)::DECIMAL(12,2) as amount
    FROM returns r
    WHERE r.store_id = $1 AND r.created_at BETWEEN $2 AND $3
    GROUP BY DATE(r.created_at)
),
supplier_payment_outflow AS (
    SELECT 
        DATE(sp.payment_date)::VARCHAR as date,
        COALESCE(SUM(sp.amount), 0)::DECIMAL(12,2) as amount
    FROM supplier_payments sp
    WHERE sp.store_id = $1 AND sp.payment_date BETWEEN $2 AND $3
    GROUP BY DATE(sp.payment_date)
)
SELECT 
    COALESCE(si.date, eo.date, ro.date, spo.date) as date,
    COALESCE(si.amount, 0) as sales_inflow,
    COALESCE(eo.amount, 0) as expense_outflow,
    COALESCE(ro.amount, 0) as refund_outflow,
    COALESCE(spo.amount, 0) as supplier_payment_outflow,
    (COALESCE(si.amount, 0) - COALESCE(eo.amount, 0) - COALESCE(ro.amount, 0) - COALESCE(spo.amount, 0))::DECIMAL(12,2) as net_flow
FROM sales_inflow si
FULL OUTER JOIN expense_outflow eo ON si.date = eo.date
FULL OUTER JOIN refund_outflow ro ON COALESCE(si.date, eo.date) = ro.date
FULL OUTER JOIN supplier_payment_outflow spo ON COALESCE(si.date, eo.date, ro.date) = spo.date
ORDER BY COALESCE(si.date, eo.date, ro.date, spo.date);

-- name: GetBalanceSheetAssets :one
SELECT 
    (SELECT COALESCE(SUM(d.amount_owed - d.amount_paid), 0)::DECIMAL(12,2) FROM debts d WHERE d.store_id = $1 AND d.amount_owed > d.amount_paid) as accounts_receivable,
    (SELECT COALESCE(SUM(p.stock_quantity * p.cost_price), 0)::DECIMAL(12,2) FROM products p WHERE p.store_id = $1 AND p.status = 'active') as inventory_value;

-- name: GetBalanceSheetLiabilities :one
SELECT 
    COALESCE(SUM(amount_owed - amount_paid), 0)::DECIMAL(12,2) as accounts_payable
FROM supplier_payables sp
WHERE sp.store_id = $1 AND sp.status != 'paid';

-- name: GetNetProfit :one
SELECT 
    COALESCE(SUM(si.total_price), 0)::DECIMAL(12,2) as total_revenue,
    COALESCE(SUM(si.quantity * p.cost_price), 0)::DECIMAL(12,2) as total_cogs,
    COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.store_id = $1 AND e.expense_date BETWEEN $2 AND $3), 0)::DECIMAL(12,2) as total_expenses,
    COALESCE((SELECT SUM(refund_amount) FROM returns r WHERE r.store_id = $1 AND r.created_at BETWEEN $2 AND $3), 0)::DECIMAL(12,2) as total_refunds,
    COALESCE((SELECT SUM(amount_owed - amount_paid) FROM supplier_payables sp WHERE sp.store_id = $1 AND sp.status != 'paid'), 0)::DECIMAL(12,2) as accounts_payable,
    (COALESCE(SUM(si.total_price), 0) - COALESCE(SUM(si.quantity * p.cost_price), 0) - COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.store_id = $1 AND e.expense_date BETWEEN $2 AND $3), 0) - COALESCE((SELECT SUM(refund_amount) FROM returns r WHERE r.store_id = $1 AND r.created_at BETWEEN $2 AND $3), 0))::DECIMAL(12,2) as net_profit
FROM sale_items si
JOIN products p ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
WHERE s.store_id = $1 AND s.sale_date BETWEEN $2 AND $3;
