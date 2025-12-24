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
