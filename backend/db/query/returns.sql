-- name: CreateReturn :one
INSERT INTO returns (
    sale_id,
    store_id,
    refund_amount,
    refund_method
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: CreateReturnItem :one
INSERT INTO return_items (
    return_id,
    sale_item_id,
    quantity,
    reason,
    condition
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: ListReturns :many
SELECT r.id, r.sale_id, r.store_id, r.refund_amount, r.refund_method, r.created_at, 
       s.total_amount AS sale_total, c.name AS customer_name
FROM returns r
JOIN sales s ON r.sale_id = s.id
LEFT JOIN customers c ON s.customer_id = c.id
WHERE r.store_id = $1
ORDER BY r.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetReturnItems :many
SELECT ri.id, ri.return_id, ri.sale_item_id, ri.quantity, ri.reason, ri.condition,
       p.name AS product_name, pv.sku AS variant_sku
FROM return_items ri
JOIN sale_items si ON ri.sale_item_id = si.id
JOIN products p ON si.product_id = p.id
LEFT JOIN product_variants pv ON si.variant_id = pv.id
WHERE ri.return_id = $1;
