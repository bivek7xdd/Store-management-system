-- name: CreateStoreInfo :one
INSERT INTO store_info (
  name,
  address,
  currency_code,
  owner_id
) VALUES (
  $1, $2, $3, $4
) RETURNING *;

-- name: GetStoreInfo :one
SELECT * FROM store_info
WHERE id = $1 LIMIT 1;

-- name: GetStoreInfoByOwner :one
SELECT * FROM store_info
WHERE owner_id = $1 LIMIT 1;

-- name: ListStoreInfo :many
SELECT * FROM store_info
ORDER BY created_at DESC
LIMIT $1
OFFSET $2;

-- name: UpdateStoreInfo :one
UPDATE store_info
SET
  name = COALESCE(sqlc.narg('name'), name),
  address = COALESCE(sqlc.narg('address'), address),
  currency_code = COALESCE(sqlc.narg('currency_code'), currency_code),
  updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteStoreInfo :exec
DELETE FROM store_info
WHERE id = $1;

-- name: GetStoreWithOwner :one
SELECT 
  sqlc.embed(store_info),
  sqlc.embed(store_owner)
FROM store_info
INNER JOIN store_owner ON store_info.owner_id = store_owner.id
WHERE store_info.id = $1;
