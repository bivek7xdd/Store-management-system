-- name: CreateExpense :one
INSERT INTO expenses (store_id, category, description, amount, expense_date, payment_method, receipt_url)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListExpenses :many
SELECT * FROM expenses
WHERE store_id = $1
  AND expense_date BETWEEN $2 AND $3
  AND ($4::TEXT = '' OR category = $4)
ORDER BY expense_date DESC;

-- name: GetExpense :one
SELECT * FROM expenses
WHERE id = $1 AND store_id = $2;

-- name: UpdateExpense :one
UPDATE expenses
SET category = $2, description = $3, amount = $4, expense_date = $5, payment_method = $6
WHERE id = $1 AND store_id = $7
RETURNING *;

-- name: DeleteExpense :exec
DELETE FROM expenses
WHERE id = $1 AND store_id = $2;

-- name: GetExpenseTotalsByCategory :many
SELECT 
    category,
    COUNT(*) as count,
    COALESCE(SUM(amount), 0)::DECIMAL(12,2) as total
FROM expenses
WHERE store_id = $1 AND expense_date BETWEEN $2 AND $3
GROUP BY category
ORDER BY total DESC;

-- name: GetExpenseSummary :one
SELECT 
    COUNT(*) as total_count,
    COALESCE(SUM(amount), 0)::DECIMAL(12,2) as total_amount
FROM expenses
WHERE store_id = $1 AND expense_date BETWEEN $2 AND $3;

-- name: GetDailyExpenses :many
SELECT 
    DATE(expense_date)::VARCHAR as expense_date,
    COALESCE(SUM(amount), 0)::DECIMAL(12,2) as daily_total
FROM expenses
WHERE store_id = $1 AND expense_date BETWEEN $2 AND $3
GROUP BY DATE(expense_date)
ORDER BY DATE(expense_date);

-- name: GetTotalExpensesForPeriod :one
SELECT 
    COALESCE(SUM(amount), 0)::DECIMAL(12,2) as total_expenses
FROM expenses
WHERE store_id = $1 AND expense_date BETWEEN $2 AND $3;
