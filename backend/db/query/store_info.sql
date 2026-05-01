-- name: CreateStoreInfo :one
INSERT INTO store_info (
  name,
  address,
  currency_code,
  owner_id,
  loyalty_progress_target,
  loyalty_discount_percentage
) VALUES (
  $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetStoreInfo :one
SELECT * FROM store_info
WHERE id = $1 LIMIT 1;

-- name: GetStoreInfoByOwner :one
SELECT * FROM store_info
WHERE owner_id = $1 LIMIT 1;

-- name: GetAllStores :many
SELECT * FROM store_info;

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
  loyalty_progress_target = COALESCE(sqlc.narg('loyalty_progress_target'), loyalty_progress_target),
  loyalty_discount_percentage = COALESCE(sqlc.narg('loyalty_discount_percentage'), loyalty_discount_percentage),
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
