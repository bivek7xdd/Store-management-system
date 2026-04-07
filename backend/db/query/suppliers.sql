-- name: CreateSuppliers :one
INSERT INTO suppliers (
  name,
  address,
  phone_number,
  email,
  store_id
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING *;


-- name: GetAllSuppliers :many
SELECT 
    s.*,
    COUNT(p.id) as product_count,
    COUNT(p.id) FILTER (WHERE p.stock_quantity <= p.low_stock_threshold) as low_stock_count
FROM suppliers s
LEFT JOIN products p ON s.id = p.supplier_id AND p.status != 'discontinued'
WHERE s.store_id = $1
GROUP BY s.id
ORDER BY s.created_at DESC;

-- name: GetSupplier :one
SELECT * FROM suppliers WHERE id = $1 AND store_id = $2;

-- name: UpdateSupplier :one
UPDATE suppliers
SET 
  name = COALESCE($2, name),
  address = COALESCE($3, address),
  phone_number = COALESCE($4, phone_number),
  email = COALESCE($5, email)
WHERE id = $1 AND store_id = $6
RETURNING *;

-- name: DeleteSupplier :exec
DELETE FROM suppliers WHERE id = $1 AND store_id = $2;