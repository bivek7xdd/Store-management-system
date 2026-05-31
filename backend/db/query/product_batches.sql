-- name: CreateProductBatch :one
INSERT INTO product_batches (
    product_id, batch_number, manufacturing_date,
    expiry_date, quantity, notes
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetProductBatch :one
SELECT pb.*, p.name as product_name, p.store_id
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE pb.id = $1 AND p.store_id = $2
LIMIT 1;

-- name: ListProductBatches :many
SELECT pb.*, p.name as product_name
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE pb.product_id = $1
ORDER BY pb.created_at DESC;

-- name: ListBatchesByStore :many
SELECT pb.*, p.name as product_name
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE p.store_id = $1
ORDER BY pb.expiry_date ASC NULLS LAST
LIMIT $2 OFFSET $3;

-- name: UpdateProductBatch :one
UPDATE product_batches pb
SET
    batch_number = COALESCE($2, batch_number),
    manufacturing_date = COALESCE($3, manufacturing_date),
    expiry_date = COALESCE($4, expiry_date),
    quantity = COALESCE($5, quantity),
    notes = COALESCE($6, notes),
    updated_at = NOW()
FROM products p
WHERE pb.id = $1 AND pb.product_id = p.id AND p.store_id = $7
RETURNING pb.*;

-- name: DeleteProductBatch :exec
DELETE FROM product_batches pb
USING products p
WHERE pb.id = $1 AND pb.product_id = p.id AND p.store_id = $2;

-- name: UpdateBatchQuantity :one
UPDATE product_batches
SET
    quantity = quantity + $2,
    updated_at = NOW()
WHERE id = $1
    AND quantity + $2 >= 0
RETURNING *;

-- name: GetExpiringBatches :many
SELECT pb.*, p.name as product_name
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE p.store_id = $1
    AND pb.expiry_date IS NOT NULL
    AND pb.expiry_date <= NOW() + ($2 || ' days')::interval
    AND pb.expiry_date > NOW()
ORDER BY pb.expiry_date ASC;

-- name: GetExpiredBatches :many
SELECT pb.*, p.name as product_name
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE p.store_id = $1
    AND pb.expiry_date IS NOT NULL
    AND pb.expiry_date <= NOW()
ORDER BY pb.expiry_date ASC;

-- name: GetBatchesByProductWithStore :many
SELECT pb.*, p.name as product_name, p.store_id
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE pb.product_id = $1 AND p.store_id = $2
ORDER BY pb.created_at DESC;