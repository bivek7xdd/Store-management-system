-- name: CreateStockChange :one
INSERT INTO stock_changes (
    product_id,
    user_id,
    change_type,
    quantity,
    previous_quantity,
    new_quantity,
    notes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetStockChangeById :one
SELECT sc.*,
       p.name as product_name,
       p.code as product_code,
       u.name as user_name
FROM stock_changes sc
LEFT JOIN products p ON sc.product_id = p.id
LEFT JOIN users u ON sc.user_id = u.id
WHERE sc.id = $1;

-- name: ListStockChanges :many
SELECT sc.*,
       p.name as product_name,
       p.code as product_code,
       u.name as user_name
FROM stock_changes sc
LEFT JOIN products p ON sc.product_id = p.id
LEFT JOIN users u ON sc.user_id = u.id
WHERE p.store_id = $1
ORDER BY sc.change_date DESC
LIMIT $2 OFFSET $3;

-- name: ListStockChangesByProduct :many
SELECT sc.*,
       u.name as user_name
FROM stock_changes sc
LEFT JOIN users u ON sc.user_id = u.id
WHERE sc.product_id = $1
ORDER BY sc.change_date DESC;

-- name: ListStockChangesByType :many
SELECT sc.*,
       p.name as product_name,
       p.code as product_code,
       u.name as user_name
FROM stock_changes sc
LEFT JOIN products p ON sc.product_id = p.id
LEFT JOIN users u ON sc.user_id = u.id
WHERE p.store_id = $1 AND sc.change_type = $2
ORDER BY sc.change_date DESC
LIMIT $3 OFFSET $4;

-- name: ListStockChangesByDateRange :many
SELECT sc.*,
       p.name as product_name,
       p.code as product_code,
       u.name as user_name
FROM stock_changes sc
LEFT JOIN products p ON sc.product_id = p.id
LEFT JOIN users u ON sc.user_id = u.id
WHERE p.store_id = $1 
  AND sc.change_date >= $2 
  AND sc.change_date <= $3
ORDER BY sc.change_date DESC;
