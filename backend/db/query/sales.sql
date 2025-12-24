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
SELECT * FROM sales
WHERE store_id = $1
ORDER BY sale_date DESC;

-- name: GetSale :one
SELECT * FROM sales
WHERE id = $1 AND store_id = $2;

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
SELECT si.*, p.name as product_name
FROM sale_items si
JOIN products p ON si.product_id = p.id
WHERE si.sale_id = $1;
