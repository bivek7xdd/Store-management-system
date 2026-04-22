-- name: GetPOSCatalog :many
SELECT 
    p.id,
    p.name,
    p.barcode,
    p.price,
    p.cost_price,
    p.stock_quantity,
    p.category_id,
    p.image_url,
    COALESCE(
        json_agg(
            json_build_object(
                'id', v.id,
                'sku', v.sku,
                'attributes', v.attributes,
                'cost_price', v.cost_price,
                'selling_price', v.selling_price,
                'stock_level', v.stock_level
            )
        ) FILTER (WHERE v.id IS NOT NULL),
        '[]'
    )::json as variants
FROM products p
LEFT JOIN product_variants v ON p.id = v.product_id AND v.archived_at IS NULL
WHERE p.store_id = $1 AND p.status != 'discontinued'
GROUP BY p.id
ORDER BY p.name ASC;
