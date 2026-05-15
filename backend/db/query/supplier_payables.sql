-- name: CreateSupplierPayable :one
INSERT INTO supplier_payables (store_id, supplier_id, description, amount_owed, amount_paid, due_date, status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListSupplierPayables :many
SELECT 
    sp.*,
    s.name as supplier_name,
    s.phone_number as supplier_phone
FROM supplier_payables sp
JOIN suppliers s ON sp.supplier_id = s.id
WHERE sp.store_id = $1
  AND ($2::TEXT = '' OR sp.status = $2)
ORDER BY 
    CASE sp.status 
        WHEN 'overdue' THEN 1 
        WHEN 'pending' THEN 2 
        WHEN 'partial' THEN 3 
        ELSE 4 
    END,
    sp.due_date ASC;

-- name: GetSupplierPayable :one
SELECT 
    sp.*,
    s.name as supplier_name,
    s.phone_number as supplier_phone
FROM supplier_payables sp
JOIN suppliers s ON sp.supplier_id = s.id
WHERE sp.id = $1 AND sp.store_id = $2;

-- name: UpdateSupplierPayable :one
UPDATE supplier_payables
SET description = $2, amount_owed = $3, due_date = $4, status = $5, updated_at = NOW()
WHERE id = $1 AND store_id = $6
RETURNING *;

-- name: DeleteSupplierPayable :exec
DELETE FROM supplier_payables
WHERE id = $1 AND store_id = $2;

-- name: RecordSupplierPayment :one
INSERT INTO supplier_payments (store_id, payable_id, amount, payment_method, notes)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdatePayableAfterPayment :one
UPDATE supplier_payables
SET amount_paid = $2, status = $3, updated_at = NOW()
WHERE id = $1 AND store_id = $4
RETURNING *;

-- name: ListPaymentsByPayable :many
SELECT * FROM supplier_payments
WHERE payable_id = $1 AND store_id = $2
ORDER BY payment_date DESC;

-- name: GetSupplierPayableSummary :one
SELECT 
    COUNT(*) as total_count,
    COALESCE(SUM(amount_owed - amount_paid), 0)::DECIMAL(12,2) as total_outstanding,
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN (amount_owed - amount_paid) ELSE 0 END), 0)::DECIMAL(12,2) as total_overdue,
    COALESCE(SUM(CASE WHEN due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status != 'paid' THEN (amount_owed - amount_paid) ELSE 0 END), 0)::DECIMAL(12,2) as due_this_week
FROM supplier_payables
WHERE store_id = $1 AND status != 'paid';

-- name: GetSupplierTotalPayable :one
SELECT 
    COALESCE(SUM(amount_owed - amount_paid), 0)::DECIMAL(12,2) as total_outstanding
FROM supplier_payables
WHERE supplier_id = $1 AND store_id = $2 AND status != 'paid';

-- name: GetOverduePayables :many
SELECT 
    sp.*,
    s.name as supplier_name
FROM supplier_payables sp
JOIN suppliers s ON sp.supplier_id = s.id
WHERE sp.store_id = $1 
  AND sp.status != 'paid'
  AND sp.due_date < NOW()
ORDER BY sp.due_date ASC;

-- name: GetDailySupplierPayments :many
SELECT 
    DATE(payment_date)::VARCHAR as payment_date,
    COALESCE(SUM(amount), 0)::DECIMAL(12,2) as daily_total
FROM supplier_payments
WHERE store_id = $1 AND payment_date BETWEEN $2 AND $3
GROUP BY DATE(payment_date)
ORDER BY DATE(payment_date);

-- name: GetTotalSupplierPaymentsForPeriod :one
SELECT 
    COALESCE(SUM(amount), 0)::DECIMAL(12,2) as total_payments
FROM supplier_payments
WHERE store_id = $1 AND payment_date BETWEEN $2 AND $3;
