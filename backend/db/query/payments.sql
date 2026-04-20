-- name: CreatePaymentRecord :one
INSERT INTO payment_records (
    sale_id,
    amount,
    payment_type,
    provider
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: ListPaymentsBySale :many
SELECT * FROM payment_records
WHERE sale_id = $1
ORDER BY created_at ASC;

-- name: GetPaymentTotalsByStore :many
SELECT payment_type, SUM(amount) as total_amount
FROM payment_records pr
JOIN sales s ON pr.sale_id = s.id
WHERE s.store_id = $1
GROUP BY payment_type;
