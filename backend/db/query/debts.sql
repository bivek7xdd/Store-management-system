-- name: CreateDebt :one
INSERT INTO debts (
    store_id,
    customer_id,
    sale_id,
    amount_owed,
    amount_paid,
    due_date,
    status,
    notes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;
