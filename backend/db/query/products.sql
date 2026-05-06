-- name: CreateProduct :one
INSERT INTO products (
    name,
    barcode,
    price,
    cost_price,
    market_price,
    stock_quantity,
    low_stock_threshold,
    expires_at,
    status,
    category_id,
    supplier_id,
    store_id,
    image_url,
    is_tracked,
    damaged_quantity,
    warranty_days
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
) RETURNING *;

-- name: GetProduct :one
SELECT * FROM products
WHERE id = $1 LIMIT 1;

-- name: ListProducts :many
SELECT * FROM products
WHERE store_id = $1 AND status != 'discontinued'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateProduct :one
UPDATE products
SET 
    name = COALESCE($2, name),
    barcode = COALESCE($3, barcode),
    price = COALESCE($4, price),
    cost_price = COALESCE($5, cost_price),
    market_price = COALESCE($6, market_price),
    stock_quantity = COALESCE($7, stock_quantity),
    low_stock_threshold = COALESCE($8, low_stock_threshold),
    expires_at = COALESCE($9, expires_at),
    status = COALESCE($10, status),
    category_id = COALESCE($11, category_id),
    supplier_id = COALESCE($12, supplier_id),
    image_url = COALESCE($13, image_url),
    is_tracked = COALESCE($14, is_tracked),
    damaged_quantity = COALESCE($15, damaged_quantity),
    warranty_days = COALESCE($16, warranty_days),
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
    store_id = $1 AND 
    status != 'discontinued' AND (
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

-- name: ListTrackedProducts :many
SELECT * FROM products
WHERE store_id = $1 AND is_tracked = TRUE AND status != 'discontinued'
ORDER BY updated_at DESC
LIMIT 6;

-- name: GetCategoryStats :one
SELECT 
    COUNT(*) as product_count,
    COALESCE(SUM(stock_quantity), 0)::int as total_stock,
    COALESCE(SUM(price * stock_quantity), 0)::numeric as total_value
FROM products
WHERE store_id = $1 AND category_id = $2 AND status != 'discontinued';

-- name: ListProductsByCategory :many
SELECT * FROM products
WHERE store_id = $1 AND category_id = $2 AND status != 'discontinued'
ORDER BY created_at DESC;

-- name: FlagExpiringProducts :exec
UPDATE products
SET status = 'expiring'
WHERE status != 'discontinued'
  AND status != 'expiring'
  AND expires_at IS NOT NULL
  AND expires_at <= NOW() + INTERVAL '7 days'
  AND expires_at > NOW();

-- name: GetLowStockProducts :many
SELECT * FROM products
WHERE store_id = $1
  AND status != 'discontinued'
  AND stock_quantity <= low_stock_threshold
ORDER BY stock_quantity ASC;

-- name: GetSupplierStats :one
SELECT 
    COUNT(*) as product_count,
    COALESCE(SUM(stock_quantity), 0)::int as total_stock,
    COALESCE(SUM(price * stock_quantity), 0)::numeric as total_value,
    COUNT(*) FILTER (WHERE stock_quantity <= low_stock_threshold) as low_stock_count
FROM products
WHERE store_id = $1 AND supplier_id = $2 AND status != 'discontinued';

-- name: ListProductsBySupplier :many
SELECT * FROM products
WHERE store_id = $1 AND supplier_id = $2 AND status != 'discontinued'
ORDER BY created_at DESC;

-- name: AddDamagedProductStock :one
UPDATE products
SET 
    damaged_quantity = damaged_quantity + $2,
    updated_at = NOW()
WHERE id = $1 AND store_id = $3
RETURNING *;

-- name: ReturnProductStock :one
UPDATE products
SET 
    stock_quantity = stock_quantity + $2,
    updated_at = NOW()
WHERE id = $1 AND store_id = $3
RETURNING *;
