-- name: CreateSale :one
INSERT INTO sales (
    store_id,
    user_id,
    customer_id,
    sale_type,
    total_amount,
    discount_applied,
    tax_amount,
    final_amount,
    receipt_number,
    notes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: GetSaleById :one
SELECT s.*, 
       u.name as user_name,
       c.name as customer_name
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = $1 AND s.store_id = $2;

-- name: ListSales :many
SELECT s.*,
       u.name as user_name,
       c.name as customer_name
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.store_id = $1
ORDER BY s.sale_date DESC
LIMIT $2 OFFSET $3;

-- name: ListSalesByCustomer :many
SELECT s.*,
       u.name as user_name
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.customer_id = $1 AND s.store_id = $2
ORDER BY s.sale_date DESC;

-- name: ListSalesByDateRange :many
SELECT s.*,
       u.name as user_name,
       c.name as customer_name
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.store_id = $1 
  AND s.sale_date >= $2 
  AND s.sale_date <= $3
ORDER BY s.sale_date DESC;

-- name: GetSalesTotalByDateRange :one
SELECT 
    COUNT(*) as total_sales,
    COALESCE(SUM(final_amount), 0) as total_revenue
FROM sales
WHERE store_id = $1 
  AND sale_date >= $2 
  AND sale_date <= $3;

-- name: UpdateSale :one
UPDATE sales SET
    receipt_url = COALESCE(sqlc.narg('receipt_url'), receipt_url),
    notes = COALESCE(sqlc.narg('notes'), notes)
WHERE id = sqlc.arg('id') AND store_id = sqlc.arg('store_id')
RETURNING *;

-- name: DeleteSale :exec
DELETE FROM sales WHERE id = $1 AND store_id = $2;

-- Sale Items queries

-- name: CreateSaleItem :one
INSERT INTO sale_items (
    sale_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    subtotal,
    discount
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetSaleItems :many
SELECT si.*,
       p.code as product_code
FROM sale_items si
LEFT JOIN products p ON si.product_id = p.id
WHERE si.sale_id = $1;

-- name: GetSaleItemById :one
SELECT * FROM sale_items WHERE id = $1;

-- name: DeleteSaleItem :exec
DELETE FROM sale_items WHERE id = $1;
