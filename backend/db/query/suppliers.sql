-- name: CreateSuppliers :one
INSERT INTO suppliers (
  name,
  address,
  phone_number,
  email,
  store_id
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING *;
