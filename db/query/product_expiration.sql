-- name: CreateProductExpiration :one
INSERT INTO product_expirations (
    product_id,
    batch_number,
    expiration_date,
    quantity
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetProductExpirationById :one
SELECT pe.*,
       p.name as product_name,
       p.code as product_code
FROM product_expirations pe
JOIN products p ON pe.product_id = p.id
WHERE pe.id = $1;

-- name: ListProductExpirations :many
SELECT pe.*,
       p.name as product_name,
       p.code as product_code
FROM product_expirations pe
JOIN products p ON pe.product_id = p.id
WHERE p.store_id = $1
ORDER BY pe.expiration_date ASC
LIMIT $2 OFFSET $3;

-- name: ListExpirationsByProduct :many
SELECT * FROM product_expirations
WHERE product_id = $1
ORDER BY expiration_date ASC;

-- name: ListExpiringSoon :many
SELECT pe.*,
       p.name as product_name,
       p.code as product_code,
       p.store_id
FROM product_expirations pe
JOIN products p ON pe.product_id = p.id
WHERE p.store_id = $1 
  AND pe.expiration_date <= $2
  AND pe.quantity > 0
ORDER BY pe.expiration_date ASC;

-- name: ListExpiredProducts :many
SELECT pe.*,
       p.name as product_name,
       p.code as product_code
FROM product_expirations pe
JOIN products p ON pe.product_id = p.id
WHERE p.store_id = $1 
  AND pe.expiration_date < CURRENT_DATE
  AND pe.quantity > 0
ORDER BY pe.expiration_date ASC;

-- name: UpdateProductExpiration :one
UPDATE product_expirations SET
    batch_number = COALESCE(sqlc.narg('batch_number'), batch_number),
    expiration_date = COALESCE(sqlc.narg('expiration_date'), expiration_date),
    quantity = COALESCE(sqlc.narg('quantity'), quantity)
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteProductExpiration :exec
DELETE FROM product_expirations WHERE id = $1;
