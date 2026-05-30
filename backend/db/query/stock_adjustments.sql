-- name: CreateStockAdjustment :one
INSERT INTO stock_adjustments (
    store_id, product_id, variant_id, adjustment_quantity,
    previous_quantity, new_quantity, reason, notes, adjusted_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: ListStockAdjustments :many
SELECT sa.*, p.name as product_name
FROM stock_adjustments sa
JOIN products p ON sa.product_id = p.id
WHERE sa.store_id = $1
ORDER BY sa.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetStockAdjustmentsByProduct :many
SELECT sa.*, p.name as product_name
FROM stock_adjustments sa
JOIN products p ON sa.product_id = p.id
WHERE sa.store_id = $1 AND sa.product_id = $2
ORDER BY sa.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CreateStockMovement :one
INSERT INTO stock_movements (
    store_id, product_id, variant_id, movement_type,
    quantity_change, reference_id, reference_type, notes
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListStockMovements :many
SELECT sm.*, p.name as product_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.store_id = $1
ORDER BY sm.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetStockMovementsByProduct :many
SELECT sm.*, p.name as product_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.store_id = $1 AND sm.product_id = $2
ORDER BY sm.created_at DESC
LIMIT $3 OFFSET $4;

-- name: GetStockMovementSummary :one
SELECT
    product_id,
    p.name as product_name,
    COALESCE(SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END), 0)::INT as total_inbound,
    COALESCE(SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END), 0)::INT as total_outbound,
    COUNT(*)::INT as movement_count
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.store_id = $1 AND sm.product_id = $2
GROUP BY product_id, p.name;
