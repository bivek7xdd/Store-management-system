-- name: CreateStoreOwner :one
INSERT INTO store_owner (
  name,
  email,
  password,
  phone,
  role,
  profile_picture
) VALUES (
  $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetStoreOwner :one
SELECT * FROM store_owner
WHERE id = $1 LIMIT 1;

-- name: GetStoreOwnerByEmail :one
SELECT * FROM store_owner
WHERE email = $1 LIMIT 1;

-- name: ListStoreOwners :many
SELECT * FROM store_owner
ORDER BY created_at DESC
LIMIT $1
OFFSET $2;

-- name: UpdateStoreOwner :one
UPDATE store_owner
SET
  name = COALESCE(sqlc.narg('name'), name),
  email = COALESCE(sqlc.narg('email'), email),
  password = COALESCE(sqlc.narg('password'), password),
  phone = COALESCE(sqlc.narg('phone'), phone),
  role = COALESCE(sqlc.narg('role'), role),
  profile_picture = COALESCE(sqlc.narg('profile_picture'), profile_picture),
  updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteStoreOwner :exec
DELETE FROM store_owner
WHERE id = $1;


-- name: GetStoreOwnerById :one
SELECT * FROM store_owner
WHERE id = $1 LIMIT 1;

-- name: UpdateEmailVerification :exec
UPDATE store_owner
SET
  emailVerified = true
WHERE email = $1;