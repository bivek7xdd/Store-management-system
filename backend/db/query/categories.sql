-- name: CreateCategories :one
INSERT INTO categories(
    name,
    description,
    store_id
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetCategories :many
SELECT * FROM categories WHERE store_id = $1;

-- name: GetCategoryByStore :one
SELECT * FROM categories WHERE store_id = $1 AND id = $2;

-- name: UpdateCategory :one
UPDATE categories
SET name = $2, description = $3
WHERE id = $1 AND store_id = $4
RETURNING *;

-- name: GetCategory :one
SELECT * FROM categories WHERE id = $1 AND store_id = $2;

-- name: DeleteCategory :exec
DELETE FROM categories WHERE store_id = $1 AND id = $2;