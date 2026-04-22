-- name: CreateProductVariant :one
INSERT INTO product_variants (
    product_id,
    sku,
    attributes,
    cost_price,
    selling_price,
    stock_level,
    image_url
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetProductVariant :one
SELECT * FROM product_variants
WHERE id = $1 LIMIT 1;

-- name: GetVariantBySKU :one
SELECT * FROM product_variants
WHERE sku = $1 LIMIT 1;

-- name: ListVariantsByProduct :many
SELECT * FROM product_variants
WHERE product_id = $1 AND archived_at IS NULL
ORDER BY created_at ASC;

-- name: UpdateProductVariant :one
UPDATE product_variants
SET 
    sku = COALESCE($2, sku),
    attributes = COALESCE($3, attributes),
    cost_price = COALESCE($4, cost_price),
    selling_price = COALESCE($5, selling_price),
    stock_level = COALESCE($6, stock_level),
    image_url = COALESCE($7, image_url),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: ArchiveProductVariant :exec
UPDATE product_variants
SET archived_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: DeleteProductVariant :exec
DELETE FROM product_variants
WHERE id = $1 AND archived_at IS NULL;

-- name: UpdateVariantStock :one
UPDATE product_variants
SET 
    stock_level = stock_level - $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
