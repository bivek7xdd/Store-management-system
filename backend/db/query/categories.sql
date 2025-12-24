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