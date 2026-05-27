-- name: CreatePurchaseOrder :one
INSERT INTO purchase_orders (store_id, order_date, expected_delivery_date, status, notes, total_cost)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdatePurchaseOrder :one
UPDATE purchase_orders
SET status = $2, notes = COALESCE($3, notes), expected_delivery_date = COALESCE($4, expected_delivery_date), total_cost = $5, updated_at = NOW()
WHERE id = $1 AND store_id = $6
RETURNING *;

-- name: UpdatePurchaseOrderStatus :one
UPDATE purchase_orders
SET status = $2, updated_at = NOW()
WHERE id = $1 AND store_id = $3
RETURNING *;

-- name: GetPurchaseOrder :one
SELECT po.*,
    COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
            'id', poi.id,
            'supplier_id', poi.supplier_id,
            'supplier_name', s.name,
            'product_id', poi.product_id,
            'product_name', poi.product_name,
            'ordered_quantity', poi.ordered_quantity,
            'received_quantity', poi.received_quantity,
            'damaged_quantity', poi.damaged_quantity,
            'unit_cost', poi.unit_cost
        ) ORDER BY poi.created_at)
        FROM purchase_order_items poi
        JOIN suppliers s ON poi.supplier_id = s.id
        WHERE poi.purchase_order_id = po.id),
        '[]'::jsonb
    )::TEXT as items_json
FROM purchase_orders po
WHERE po.id = $1 AND po.store_id = $2;

-- name: ListPurchaseOrders :many
SELECT po.id, po.order_date, po.status, po.total_cost, po.created_at,
    COALESCE(
        (SELECT jsonb_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name))
        FROM purchase_order_items poi
        JOIN suppliers s ON poi.supplier_id = s.id
        WHERE poi.purchase_order_id = po.id),
        '[]'::jsonb
    )::TEXT as suppliers_json
FROM purchase_orders po
WHERE po.store_id = $1
ORDER BY po.created_at DESC;

-- name: DeletePurchaseOrder :exec
DELETE FROM purchase_orders
WHERE id = $1 AND store_id = $2 AND status = 'draft';

-- name: CreatePurchaseOrderItem :one
INSERT INTO purchase_order_items (purchase_order_id, supplier_id, product_id, product_name, ordered_quantity, unit_cost)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdatePurchaseOrderItem :one
UPDATE purchase_order_items
SET received_quantity = $2, damaged_quantity = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetPOItemsBySupplier :many
SELECT poi.*, s.name as supplier_name
FROM purchase_order_items poi
JOIN suppliers s ON poi.supplier_id = s.id
WHERE poi.purchase_order_id = $1
ORDER BY poi.supplier_id, poi.created_at;

-- name: GetPurchaseOrdersBySupplier :many
SELECT po.*
FROM purchase_orders po
WHERE po.store_id = $1
  AND EXISTS (
    SELECT 1 FROM purchase_order_items poi
    WHERE poi.purchase_order_id = po.id AND poi.supplier_id = $2
  )
ORDER BY po.created_at DESC;

-- name: GetPOItemsForReceive :many
SELECT poi.*, s.name as supplier_name, p.name as product_name_lookup
FROM purchase_order_items poi
JOIN suppliers s ON poi.supplier_id = s.id
LEFT JOIN products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = $1
ORDER BY poi.supplier_id, poi.created_at;

-- name: UpdatePOItemReceive :one
UPDATE purchase_order_items
SET received_quantity = received_quantity + $2,
    damaged_quantity = damaged_quantity + $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetPOItem :one
SELECT poi.*, s.name as supplier_name
FROM purchase_order_items poi
JOIN suppliers s ON poi.supplier_id = s.id
WHERE poi.id = $1;

-- name: DeletePOItemsByOrder :exec
DELETE FROM purchase_order_items
WHERE purchase_order_id = $1;
