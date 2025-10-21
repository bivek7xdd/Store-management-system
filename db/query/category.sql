-- name: CreateCategory :one
INSERT INTO categories (
    name,
    description,
    slug
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetCategoryById :one
SELECT * FROM categories WHERE id = $1;

-- name: GetCategoryBySlug :one
SELECT * FROM categories WHERE slug = $1;

-- name: GetCategories :many
SELECT * FROM categories WHERE is_active = $1;

-- name: UpdateCategory :one
UPDATE categories
SET
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    is_active = COALESCE($4, is_active),
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: DeleteCategory :one
DELETE FROM categories WHERE id = $1 RETURNING *;

