-- name: CreateSupplier :one
INSERT INTO suppliers (
    name,
    slug,
    contact_phone,
    contact_email,
    address
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetSupplierById :one
SELECT * FROM suppliers WHERE id = $1;

-- name: GetSupplierBySlug :one
SELECT * FROM suppliers WHERE slug = $1;

-- name: ListSuppliers :many
SELECT * FROM suppliers 
WHERE is_active = true
ORDER BY name
LIMIT $1 OFFSET $2;

-- name: SearchSuppliers :many
SELECT * FROM suppliers
WHERE LOWER(name) LIKE LOWER($1) AND is_active = true
ORDER BY name
LIMIT $2 OFFSET $3;

-- name: UpdateSupplier :one
UPDATE suppliers
SET
    name = COALESCE(sqlc.narg('name'), name),
    slug = COALESCE(sqlc.narg('slug'), slug),
    contact_phone = COALESCE(sqlc.narg('contact_phone'), contact_phone),
    contact_email = COALESCE(sqlc.narg('contact_email'), contact_email),
    address = COALESCE(sqlc.narg('address'), address),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteSupplier :one
UPDATE suppliers
SET is_active = false, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: HardDeleteSupplier :exec
DELETE FROM suppliers WHERE id = $1;

-- name: GetSupplierProducts :many
SELECT p.* FROM products p
WHERE p.supplier_id = $1 AND p.is_active = true
ORDER BY p.name;
