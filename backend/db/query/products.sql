-- name: CreateProduct :one
INSERT INTO products (
    name,
    barcode,
    price,
    market_price,
    stock_quantity,
    low_stock_threshold,
    expires_at,
    status,
    category_id,
    supplier_id,
    store_id,
    image_url
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING *;

-- name: GetProduct :one
SELECT * FROM products
WHERE id = $1 LIMIT 1;

-- name: ListProducts :many
SELECT * FROM products
WHERE store_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateProduct :one
UPDATE products
SET 
    name = COALESCE($2, name),
    barcode = COALESCE($3, barcode),
    price = COALESCE($4, price),
    market_price = COALESCE($5, market_price),
    stock_quantity = COALESCE($6, stock_quantity),
    low_stock_threshold = COALESCE($7, low_stock_threshold),
    expires_at = COALESCE($8, expires_at),
    status = COALESCE($9, status),
    category_id = COALESCE($10, category_id),
    supplier_id = COALESCE($11, supplier_id),
    image_url = COALESCE($12, image_url),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :exec
UPDATE products
SET status = 'discontinued'
WHERE id = $1;

-- name: SearchProducts :many
SELECT * FROM products
WHERE 
    store_id = $1 AND (
    name ILIKE '%' || $2 || '%' OR
    barcode ILIKE '%' || $2 || '%'
    )
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: UpdateProductStock :one
UPDATE products
SET 
    stock_quantity = stock_quantity - $2,
    updated_at = NOW()
WHERE id = $1 AND store_id = $3
RETURNING *;
