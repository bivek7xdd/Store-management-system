-- name: CreateSale :one
INSERT INTO sales (
    sales_type,
    total_amount,
    discount_applied,
    receipt_url,
    store_id,
    customer_id
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: ListSales :many
SELECT 
    s.id, s.sales_type, s.total_amount::float as total_amount, s.discount_applied::float as discount_applied, s.receipt_url, s.sale_date, s.store_id, s.customer_id,
    c.name as customer_name,
    c.phone as customer_phone
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.store_id = $1
ORDER BY s.sale_date DESC;

-- name: GetSale :one
SELECT 
    s.id, s.sales_type, s.total_amount::float as total_amount, s.discount_applied::float as discount_applied, s.receipt_url, s.sale_date, s.store_id, s.customer_id,
    c.name as customer_name,
    c.phone as customer_phone
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = $1 AND s.store_id = $2;

-- name: CreateSaleItem :one
INSERT INTO sale_items (
    sale_id,
    product_id,
    quantity,
    unit_price,
    total_price
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetSaleItems :many
SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price::float as unit_price, si.total_price::float as total_price, p.name as product_name
FROM sale_items si
JOIN products p ON si.product_id = p.id
WHERE si.sale_id = $1;
