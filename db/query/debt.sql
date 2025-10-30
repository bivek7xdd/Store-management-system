-- name: CreateDebt :one
INSERT INTO debts (
    store_id,
    customer_id,
    sale_id,
    amount_owed,
    amount_remaining,
    due_date,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetDebtById :one
SELECT d.*,
       c.name as customer_name,
       c.phone as customer_phone
FROM debts d
JOIN customers c ON d.customer_id = c.id
WHERE d.id = $1 AND d.store_id = $2;

-- name: ListDebts :many
SELECT d.*,
       c.name as customer_name,
       c.phone as customer_phone
FROM debts d
JOIN customers c ON d.customer_id = c.id
WHERE d.store_id = $1
ORDER BY d.due_date ASC
LIMIT $2 OFFSET $3;

-- name: ListDebtsByStatus :many
SELECT d.*,
       c.name as customer_name,
       c.phone as customer_phone
FROM debts d
JOIN customers c ON d.customer_id = c.id
WHERE d.store_id = $1 AND d.status = $2
ORDER BY d.due_date ASC;

-- name: ListDebtsByCustomer :many
SELECT d.*
FROM debts d
WHERE d.customer_id = $1 AND d.store_id = $2
ORDER BY d.due_date ASC;

-- name: ListOverdueDebts :many
SELECT d.*,
       c.name as customer_name,
       c.phone as customer_phone
FROM debts d
JOIN customers c ON d.customer_id = c.id
WHERE d.store_id = $1 
  AND d.due_date < CURRENT_DATE
  AND d.status IN ('pending', 'partial')
ORDER BY d.due_date ASC;

-- name: GetDebtSummary :one
SELECT 
    COUNT(*) as total_debts,
    COALESCE(SUM(amount_remaining), 0) as total_amount_remaining,
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount_remaining ELSE 0 END), 0) as overdue_amount
FROM debts
WHERE store_id = $1 AND status IN ('pending', 'partial', 'overdue');

-- name: UpdateDebt :one
UPDATE debts SET
    amount_paid = $2,
    amount_remaining = $3,
    status = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateDebtStatus :one
UPDATE debts SET
    status = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteDebt :exec
DELETE FROM debts WHERE id = $1 AND store_id = $2;

-- Debt Payments queries

-- name: CreateDebtPayment :one
INSERT INTO debt_payments (
    debt_id,
    amount_paid,
    payment_method,
    received_by,
    notes
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetDebtPayments :many
SELECT dp.*,
       u.name as received_by_name
FROM debt_payments dp
LEFT JOIN users u ON dp.received_by = u.id
WHERE dp.debt_id = $1
ORDER BY dp.payment_date DESC;

-- name: GetDebtPaymentById :one
SELECT dp.*,
       u.name as received_by_name
FROM debt_payments dp
LEFT JOIN users u ON dp.received_by = u.id
WHERE dp.id = $1;

-- name: DeleteDebtPayment :exec
DELETE FROM debt_payments WHERE id = $1;
