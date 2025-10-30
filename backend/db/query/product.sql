-- name: CreateProduct :one
INSERT INTO products (
    name,
    code,
    slug,
    category_id,
    supplier_id,
    price,
    market_price,
    stock_quantity,
    low_stock_threshold,
    is_perishable,
    unit_of_measure,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING *;

-- name: GetProductById :one
SELECT p.*, 
       c.name as category_name,
       s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.id = $1;

-- name: GetProductByCode :one
SELECT * FROM products WHERE code = $1;

-- name: GetProductBySlug :one
SELECT p.*, 
       c.name as category_name,
       s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.slug = $1;

-- name: ListProducts :many
SELECT p.*, 
       c.name as category_name,
       s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListProductsByCategory :many
SELECT p.*, 
       c.name as category_name,
       s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.category_id = $1 AND p.is_active = true
ORDER BY p.name;

-- name: ListLowStockProducts :many
SELECT p.*, 
       c.name as category_name,
       s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.stock_quantity <= p.low_stock_threshold 
  AND p.is_active = true
ORDER BY p.stock_quantity ASC;

-- name: SearchProducts :many
SELECT p.*, 
       c.name as category_name,
       s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE (LOWER(p.name) LIKE LOWER($1) OR LOWER(p.code) LIKE LOWER($1))
  AND p.is_active = true
ORDER BY p.name
LIMIT $2 OFFSET $3;

-- name: UpdateProduct :one
UPDATE products
SET
    name = COALESCE(sqlc.narg('name'), name),
    code = COALESCE(sqlc.narg('code'), code),
    slug = COALESCE(sqlc.narg('slug'), slug),
    category_id = COALESCE(sqlc.narg('category_id'), category_id),
    supplier_id = COALESCE(sqlc.narg('supplier_id'), supplier_id),
    price = COALESCE(sqlc.narg('price'), price),
    market_price = COALESCE(sqlc.narg('market_price'), market_price),
    stock_quantity = COALESCE(sqlc.narg('stock_quantity'), stock_quantity),
    low_stock_threshold = COALESCE(sqlc.narg('low_stock_threshold'), low_stock_threshold),
    is_perishable = COALESCE(sqlc.narg('is_perishable'), is_perishable),
    unit_of_measure = COALESCE(sqlc.narg('unit_of_measure'), unit_of_measure),
    status = COALESCE(sqlc.narg('status'), status),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: UpdateProductStock :one
UPDATE products
SET
    stock_quantity = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :one
UPDATE products
SET is_active = false, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: HardDeleteProduct :exec
DELETE FROM products WHERE id = $1;
