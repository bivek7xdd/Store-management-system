-- name: CreateCustomer :one
INSERT INTO customers (
    name,
    phone,
    store_id
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: GetCustomerByPhone :one
SELECT * FROM customers
WHERE phone = $1 AND store_id = $2;

-- name: ListCustomers :many
SELECT * FROM customers
WHERE store_id = $1
ORDER BY name;

-- name: GetCustomerLoyaltyStatus :one
SELECT loyalty_status, purchase_count, loyalty_points 
FROM customers
WHERE id = $1 AND store_id = $2;

-- name: IncrementCustomerPurchaseCount :exec
UPDATE customers
SET purchase_count = purchase_count + 1,
    last_purchase_at = CURRENT_TIMESTAMP
WHERE id = $1 AND store_id = $2;

-- name: UpdateCustomerLoyalty :exec
UPDATE customers
SET loyalty_status = $1,
    loyalty_points = $2
WHERE id = $3 AND store_id = $4;

-- name: SearchCustomers :many
SELECT * FROM customers
WHERE store_id = $1 AND (name ILIKE $2 OR phone ILIKE $2)
ORDER BY name
LIMIT 20;
