-- name: CreateCategories :one
INSERT INTO categories(
    name,
    description,
    store_id
) VALUES (
    $1, $2, $3
) RETURNING *;