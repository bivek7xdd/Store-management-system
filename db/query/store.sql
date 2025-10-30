-- name: CreateStore :one
INSERT INTO stores (
    owner_id,
    name,
    slug,
    business_type,
    description,
    address,
    phone,
    email,
    currency,
    timezone
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: GetStoreById :one
SELECT * FROM stores WHERE id = $1;

-- name: GetStoreBySlug :one
SELECT * FROM stores WHERE slug = $1;

-- name: GetUserStores :many
SELECT s.* FROM stores s
JOIN store_users su ON s.id = su.store_id
WHERE su.user_id = $1 AND su.is_active = true AND s.is_active = true
ORDER BY s.created_at DESC;

-- name: GetStoresByOwner :many
SELECT * FROM stores 
WHERE owner_id = $1 AND is_active = true
ORDER BY created_at DESC;

-- name: UpdateStore :one
UPDATE stores SET
    name = COALESCE(sqlc.narg('name'), name),
    business_type = COALESCE(sqlc.narg('business_type'), business_type),
    description = COALESCE(sqlc.narg('description'), description),
    address = COALESCE(sqlc.narg('address'), address),
    phone = COALESCE(sqlc.narg('phone'), phone),
    email = COALESCE(sqlc.narg('email'), email),
    logo_url = COALESCE(sqlc.narg('logo_url'), logo_url),
    currency = COALESCE(sqlc.narg('currency'), currency),
    timezone = COALESCE(sqlc.narg('timezone'), timezone),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    subscription_plan = COALESCE(sqlc.narg('subscription_plan'), subscription_plan),
    subscription_expires_at = COALESCE(sqlc.narg('subscription_expires_at'), subscription_expires_at),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteStore :one
UPDATE stores SET is_active = false, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: HardDeleteStore :exec
DELETE FROM stores WHERE id = $1;
