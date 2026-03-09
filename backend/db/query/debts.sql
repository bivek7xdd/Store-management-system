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

-- name: GetDebts :many
SELECT 
    d.id, d.store_id, d.customer_id, d.sale_id, d.amount_owed, d.amount_paid, d.due_date, d.status, d.notes, d.created_at, d.updated_at,
    c.name as customer_name,
    c.phone as customer_phone
FROM debts d
LEFT JOIN customers c ON d.customer_id = c.id
WHERE d.store_id = $1
ORDER BY d.created_at DESC;

-- name: GetDebt :one
SELECT 
    d.id, d.store_id, d.customer_id, d.sale_id, d.amount_owed, d.amount_paid, d.due_date, d.status, d.notes, d.created_at, d.updated_at,
    c.name as customer_name,
    c.phone as customer_phone
FROM debts d
LEFT JOIN customers c ON d.customer_id = c.id
WHERE d.id = $1 AND d.store_id = $2;

-- name: UpdateDebt :one
UPDATE debts
SET 
    amount_owed = COALESCE(sqlc.narg('amount_owed'), amount_owed),
    amount_paid = COALESCE(sqlc.narg('amount_paid'), amount_paid),
    due_date = COALESCE(sqlc.narg('due_date'), due_date),
    status = COALESCE(sqlc.narg('status'), status),
    notes = COALESCE(sqlc.narg('notes'), notes),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND store_id = $2
RETURNING *;

-- name: DeleteDebt :exec
DELETE FROM debts
WHERE id = $1 AND store_id = $2;

-- name: RecordDebtPayment :one
UPDATE debts
SET 
    amount_paid = amount_paid + $3,
    status = CASE 
        WHEN amount_paid + $3 >= amount_owed THEN 'paid'::debt_status 
        ELSE 'partial'::debt_status 
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND store_id = $2
RETURNING *;
