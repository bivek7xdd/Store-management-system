-- name: CreateCustomer :one
INSERT INTO customers (
    store_id,
    name,
    phone,
    email,
    address,
    notification_token
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetCustomerById :one
SELECT * FROM customers WHERE id = $1 AND store_id = $2;

-- name: GetCustomerByPhone :one
SELECT * FROM customers WHERE phone = $1 AND store_id = $2;

-- name: ListCustomers :many
SELECT * FROM customers 
WHERE store_id = $1 AND is_active = true
ORDER BY name
LIMIT $2 OFFSET $3;

-- name: SearchCustomers :many
SELECT * FROM customers
WHERE store_id = $1 
  AND (LOWER(name) LIKE LOWER($2) OR phone LIKE $2)
  AND is_active = true
ORDER BY name
LIMIT $3 OFFSET $4;

-- name: GetCustomersWithDebt :many
SELECT * FROM customers
WHERE store_id = $1 AND total_debt > 0 AND is_active = true
ORDER BY total_debt DESC
LIMIT $2 OFFSET $3;

-- name: UpdateCustomer :one
UPDATE customers SET
    name = COALESCE(sqlc.narg('name'), name),
    phone = COALESCE(sqlc.narg('phone'), phone),
    email = COALESCE(sqlc.narg('email'), email),
    address = COALESCE(sqlc.narg('address'), address),
    notification_token = COALESCE(sqlc.narg('notification_token'), notification_token),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    updated_at = NOW()
WHERE id = sqlc.arg('id') AND store_id = sqlc.arg('store_id')
RETURNING *;

-- name: UpdateCustomerTotals :one
UPDATE customers SET
    total_purchases = $2,
    total_debt = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteCustomer :one
UPDATE customers SET is_active = false, updated_at = NOW()
WHERE id = $1 AND store_id = $2
RETURNING *;
