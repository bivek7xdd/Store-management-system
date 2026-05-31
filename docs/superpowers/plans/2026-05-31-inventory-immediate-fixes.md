# Inventory Immediate Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stock adjustment with audit trail, inventory valuation report, stock movement history, and unit tests for inventory handlers.

**Architecture:** New `stock_adjustments` table for audit trail, new `stock_movements` table for history, new queries and handlers for valuation reports, and comprehensive unit tests for all inventory handlers.

**Tech Stack:** Go, Gin, SQLC, PostgreSQL, testify (testing)

---

## File Structure

| File | Purpose |
|------|---------|
| `backend/db/schema/16_stock_adjustments.sql` | New schema for stock adjustments and movements |
| `backend/db/query/stock_adjustments.sql` | SQLC queries for stock adjustments |
| `backend/db/query/inventory_reports.sql` | SQLC queries for inventory valuation reports |
| `backend/handlers/stock_adjustment.handler.go` | Handler for stock adjustment CRUD |
| `backend/handlers/inventory_reports.handler.go` | Handler for inventory valuation reports |
| `backend/handlers/inventory_test.go` | Add tests for new handlers |
| `backend/main.go` | Register new routes |

---

## Task 1: Create Stock Adjustments & Movements Schema

**Files:**
- Create: `backend/db/schema/16_stock_adjustments.sql`

- [ ] **Step 1: Create the schema file**

```sql
-- Stock adjustment reason enum
CREATE TYPE stock_adjustment_reason AS ENUM (
    'physical_count',
    'damaged',
    'expired',
    'theft',
    'correction',
    'return',
    'other'
);

-- Stock adjustments table (audit trail for manual adjustments)
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID, -- optional, for variant-level adjustments
    adjustment_quantity INT NOT NULL, -- positive = add stock, negative = remove stock
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reason stock_adjustment_reason NOT NULL DEFAULT 'correction',
    notes TEXT,
    adjusted_by UUID, -- user who made the adjustment
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table (automatic log of all stock changes)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store_info(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID, -- optional
    movement_type VARCHAR(20) NOT NULL, -- 'sale', 'purchase', 'adjustment', 'return', 'transfer'
    quantity_change INT NOT NULL, -- positive = inbound, negative = outbound
    reference_id UUID, -- sale_id, purchase_order_id, adjustment_id, etc.
    reference_type VARCHAR(50), -- 'sale', 'purchase_order', 'adjustment', 'return'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_stock_adjustments_store_id ON stock_adjustments(store_id);
CREATE INDEX idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);

CREATE INDEX idx_stock_movements_store_id ON stock_movements(store_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
```

- [ ] **Step 2: Verify schema is valid SQL**

Run: `cd backend && psql $DATABASE_URL -f db/schema/16_stock_adjustments.sql`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/db/schema/16_stock_adjustments.sql
git commit -m "feat: add stock_adjustments and stock_movements schema"
```

---

## Task 2: Write SQLC Queries for Stock Adjustments

**Files:**
- Create: `backend/db/query/stock_adjustments.sql`

- [ ] **Step 1: Create stock adjustments queries**

```sql
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
ORDER BY sa.created_at DESC;

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
ORDER BY sm.created_at DESC;

-- name: GetStockMovementSummary :one
SELECT
    product_id,
    p.name as product_name,
    SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END)::INT as total_inbound,
    SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END)::INT as total_outbound,
    COUNT(*) as movement_count
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.store_id = $1 AND sm.product_id = $2
GROUP BY product_id, p.name;
```

- [ ] **Step 2: Generate SQLC code**

Run: `cd backend && make sqlc` (or `sqlc generate`)
Expected: Generated code in `db/sqlc/`

- [ ] **Step 3: Commit**

```bash
git add backend/db/query/stock_adjustments.sql backend/db/sqlc/
git commit -m "feat: add SQLC queries for stock adjustments and movements"
```

---

## Task 3: Write SQLC Queries for Inventory Valuation Report

**Files:**
- Create: `backend/db/query/inventory_reports.sql`

- [ ] **Step 1: Create inventory reports queries**

```sql
-- name: GetInventoryValuation :many
SELECT
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    p.cost_price,
    p.price as selling_price,
    (p.stock_quantity * p.cost_price)::DECIMAL(12,2) as cost_value,
    (p.stock_quantity * p.price)::DECIMAL(12,2) as retail_value,
    ((p.price - p.cost_price) * p.stock_quantity)::DECIMAL(12,2) as potential_profit
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1 AND p.status = 'active'
ORDER BY cost_value DESC;

-- name: GetInventoryValuationSummary :one
SELECT
    COUNT(*) as total_products,
    SUM(stock_quantity)::INT as total_units,
    COALESCE(SUM(stock_quantity * cost_price), 0)::DECIMAL(12,2) as total_cost_value,
    COALESCE(SUM(stock_quantity * price), 0)::DECIMAL(12,2) as total_retail_value,
    COALESCE(SUM((price - cost_price) * stock_quantity), 0)::DECIMAL(12,2) as total_potential_profit
FROM products
WHERE store_id = $1 AND status = 'active';

-- name: GetInventoryValuationByCategory :many
SELECT
    c.id as category_id,
    c.name as category_name,
    COUNT(p.id) as product_count,
    SUM(p.stock_quantity)::INT as total_units,
    COALESCE(SUM(p.stock_quantity * p.cost_price), 0)::DECIMAL(12,2) as total_cost_value,
    COALESCE(SUM(p.stock_quantity * p.price), 0)::DECIMAL(12,2) as total_retail_value
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1 AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY total_cost_value DESC;

-- name: GetLowStockReport :many
SELECT
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    p.low_stock_threshold,
    (p.low_stock_threshold - p.stock_quantity)::INT as units_below_threshold,
    p.cost_price,
    (p.cost_price * (p.low_stock_threshold - p.stock_quantity))::DECIMAL(12,2) as reorder_cost
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1
    AND p.status = 'active'
    AND p.stock_quantity <= p.low_stock_threshold
ORDER BY units_below_threshold DESC;

-- name: GetExpiringProductsReport :many
SELECT
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.stock_quantity,
    p.expires_at,
    p.cost_price,
    (p.stock_quantity * p.cost_price)::DECIMAL(12,2) as capital_at_risk,
    EXTRACT(DAY FROM (p.expires_at - NOW()))::INT as days_until_expiry
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.store_id = $1
    AND p.status IN ('active', 'expiring')
    AND p.expires_at IS NOT NULL
    AND p.expires_at <= NOW() + INTERVAL '30 days'
ORDER BY p.expires_at ASC;
```

- [ ] **Step 2: Generate SQLC code**

Run: `cd backend && make sqlc` (or `sqlc generate`)
Expected: Generated code in `db/sqlc/`

- [ ] **Step 3: Commit**

```bash
git add backend/db/query/inventory_reports.sql backend/db/sqlc/
git commit -m "feat: add SQLC queries for inventory valuation and reports"
```

---

## Task 4: Create Stock Adjustment Handler

**Files:**
- Create: `backend/handlers/stock_adjustment.handler.go`

- [ ] **Step 1: Create the handler file**

```go
package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type createStockAdjustmentReq struct {
	ProductID           string  `json:"product_id" binding:"required"`
	VariantID           string  `json:"variant_id"`
	AdjustmentQuantity  int32   `json:"adjustment_quantity" binding:"required"`
	Reason              string  `json:"reason" binding:"required"`
	Notes               string  `json:"notes"`
}

func CreateStockAdjustment(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	var req createStockAdjustmentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if req.AdjustmentQuantity == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Adjustment quantity cannot be zero", nil)
		return
	}

	// Validate reason
	validReasons := map[string]bool{
		"physical_count": true, "damaged": true, "expired": true,
		"theft": true, "correction": true, "return": true, "other": true,
	}
	if !validReasons[req.Reason] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid reason", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	productUUID, err := utils.ParseUUID(req.ProductID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	// Get current product stock
	product, err := utils.Queries.GetProduct(ctx, db.GetProductParams{
		ID:      productUUID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Product not found", err)
		return
	}

	previousQuantity := product.StockQuantity
	newQuantity := previousQuantity + req.AdjustmentQuantity

	if newQuantity < 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Adjustment would result in negative stock", nil)
		return
	}

	// Create adjustment record
	adjustment, err := utils.Queries.CreateStockAdjustment(ctx, db.CreateStockAdjustmentParams{
		StoreID:             storeID,
		ProductID:           productUUID,
		AdjustmentQuantity:  req.AdjustmentQuantity,
		PreviousQuantity:    previousQuantity,
		NewQuantity:         newQuantity,
		Reason:              db.StockAdjustmentReason(req.Reason),
		Notes:               utils.OptionalText(req.Notes),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create adjustment", err)
		return
	}

	// Update product stock
	_, err = utils.Queries.UpdateProduct(ctx, db.UpdateProductParams{
		ID:                productUUID,
		StockQuantity:     newQuantity,
		StoreID:           storeID,
		Name:              product.Name,
		Barcode:           product.Barcode,
		Price:             product.Price,
		CostPrice:         product.CostPrice,
		MarketPrice:       product.MarketPrice,
		LowStockThreshold: product.LowStockThreshold,
		ExpiresAt:         product.ExpiresAt,
		Status:            product.Status,
		CategoryID:        product.CategoryID,
		SupplierID:        product.SupplierID,
		ImageUrl:          product.ImageUrl,
		IsTracked:         product.IsTracked,
		DamagedQuantity:   product.DamagedQuantity,
		WarrantyDays:      product.WarrantyDays,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update stock", err)
		return
	}

	// Create stock movement record
	_, err = utils.Queries.CreateStockMovement(ctx, db.CreateStockMovementParams{
		StoreID:        storeID,
		ProductID:      productUUID,
		MovementType:   "adjustment",
		QuantityChange:  req.AdjustmentQuantity,
		ReferenceID:    adjustment.ID,
		ReferenceType:  utils.Text("adjustment"),
		Notes:          utils.OptionalText(req.Notes),
	})
	if err != nil {
		// Non-fatal, log and continue
		log.Printf("Warning: failed to create stock movement record: %v", err)
	}

	// Check for low stock notification
	utils.Queries.CheckAndNotifyLowStock(ctx, storeID, product)

	utils.SuccessResponse(c, "Stock adjustment created successfully", adjustment)
}

func ListStockAdjustments(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	adjustments, err := utils.Queries.ListStockAdjustments(ctx, db.ListStockAdjustmentsParams{
		StoreID: storeID,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch adjustments", err)
		return
	}

	if adjustments == nil {
		adjustments = []db.ListStockAdjustmentsRow{}
	}

	utils.SuccessResponse(c, "Stock adjustments fetched successfully", adjustments)
}

func GetStockAdjustmentsByProduct(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	productID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	adjustments, err := utils.Queries.GetStockAdjustmentsByProduct(ctx, db.GetStockAdjustmentsByProductParams{
		StoreID:   storeID,
		ProductID: productID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch adjustments", err)
		return
	}

	if adjustments == nil {
		adjustments = []db.GetStockAdjustmentsByProductRow{}
	}

	utils.SuccessResponse(c, "Stock adjustments fetched successfully", adjustments)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/handlers/stock_adjustment.handler.go
git commit -m "feat: add stock adjustment handler with audit trail"
```

---

## Task 5: Create Stock Movement Handler

**Files:**
- Create: `backend/handlers/stock_movement.handler.go`

- [ ] **Step 1: Create the handler file**

```go
package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
)

func ListStockMovements(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	movements, err := utils.Queries.ListStockMovements(ctx, db.ListStockMovementsParams{
		StoreID: storeID,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch movements", err)
		return
	}

	if movements == nil {
		movements = []db.ListStockMovementsRow{}
	}

	utils.SuccessResponse(c, "Stock movements fetched successfully", movements)
}

func GetStockMovementsByProduct(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	productID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	movements, err := utils.Queries.GetStockMovementsByProduct(ctx, db.GetStockMovementsByProductParams{
		StoreID:   storeID,
		ProductID: productID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch movements", err)
		return
	}

	if movements == nil {
		movements = []db.GetStockMovementsByProductRow{}
	}

	utils.SuccessResponse(c, "Stock movements fetched successfully", movements)
}

func GetStockMovementSummary(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	productID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	summary, err := utils.Queries.GetStockMovementSummary(ctx, db.GetStockMovementSummaryParams{
		StoreID:   storeID,
		ProductID: productID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch summary", err)
		return
	}

	utils.SuccessResponse(c, "Stock movement summary fetched successfully", summary)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/handlers/stock_movement.handler.go
git commit -m "feat: add stock movement handler for history tracking"
```

---

## Task 6: Create Inventory Reports Handler

**Files:**
- Create: `backend/handlers/inventory_reports.handler.go`

- [ ] **Step 1: Create the handler file**

```go
package handlers

import (
	"context"
	"net/http"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
)

func GetInventoryValuation(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Get detailed valuation
	valuation, err := utils.Queries.GetInventoryValuation(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch valuation", err)
		return
	}

	if valuation == nil {
		valuation = []db.GetInventoryValuationRow{}
	}

	// Get summary
	summary, err := utils.Queries.GetInventoryValuationSummary(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch summary", err)
		return
	}

	// Get by category
	byCategory, err := utils.Queries.GetInventoryValuationByCategory(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch category breakdown", err)
		return
	}

	if byCategory == nil {
		byCategory = []db.GetInventoryValuationByCategoryRow{}
	}

	utils.SuccessResponse(c, "Inventory valuation fetched successfully", gin.H{
		"summary":     summary,
		"by_category": byCategory,
		"products":    valuation,
	})
}

func GetLowStockReport(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	lowStock, err := utils.Queries.GetLowStockReport(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch low stock report", err)
		return
	}

	if lowStock == nil {
		lowStock = []db.GetLowStockReportRow{}
	}

	// Calculate total reorder cost
	var totalReorderCost float64
	for _, item := range lowStock {
		cost, _ := item.ReorderCost.Float64Value()
		totalReorderCost += cost.Float64
	}

	utils.SuccessResponse(c, "Low stock report fetched successfully", gin.H{
		"items":             lowStock,
		"total_reorder_cost": totalReorderCost,
		"count":             len(lowStock),
	})
}

func GetExpiringProductsReport(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	expiring, err := utils.Queries.GetExpiringProductsReport(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch expiring products", err)
		return
	}

	if expiring == nil {
		expiring = []db.GetExpiringProductsReportRow{}
	}

	// Calculate total capital at risk
	var totalCapitalAtRisk float64
	for _, item := range expiring {
		capital, _ := item.CapitalAtRisk.Float64Value()
		totalCapitalAtRisk += capital.Float64
	}

	utils.SuccessResponse(c, "Expiring products report fetched successfully", gin.H{
		"items":              expiring,
		"total_capital_at_risk": totalCapitalAtRisk,
		"count":              len(expiring),
	})
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/handlers/inventory_reports.handler.go
git commit -m "feat: add inventory valuation and reports handlers"
```

---

## Task 7: Register New Routes

**Files:**
- Modify: `backend/main.go`

- [ ] **Step 1: Add routes to main.go**

Add after the existing product routes block (around line 134):

```go
// Stock adjustment routes
stockAdjustmentRoutes := router.Group("/api/stock-adjustments")
stockAdjustmentRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
{
	stockAdjustmentRoutes.POST("", handlers.CreateStockAdjustment)
	stockAdjustmentRoutes.GET("", handlers.ListStockAdjustments)
	stockAdjustmentRoutes.GET("/product/:id", handlers.GetStockAdjustmentsByProduct)
}

// Stock movement routes
stockMovementRoutes := router.Group("/api/stock-movements")
stockMovementRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
{
	stockMovementRoutes.GET("", handlers.ListStockMovements)
	stockMovementRoutes.GET("/product/:id", handlers.GetStockMovementsByProduct)
	stockMovementRoutes.GET("/product/:id/summary", handlers.GetStockMovementSummary)
}

// Inventory report routes
inventoryReportRoutes := router.Group("/api/inventory-reports")
inventoryReportRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
{
	inventoryReportRoutes.GET("/valuation", handlers.GetInventoryValuation)
	inventoryReportRoutes.GET("/low-stock", handlers.GetLowStockReport)
	inventoryReportRoutes.GET("/expiring", handlers.GetExpiringProductsReport)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/main.go
git commit -m "feat: register stock adjustment, movement, and inventory report routes"
```

---

## Task 8: Write Unit Tests for Stock Adjustment Handler

**Files:**
- Modify: `backend/handlers/inventory_test.go`

- [ ] **Step 1: Add test helper and tests**

Add to the end of `inventory_test.go`:

```go
// ====================================================================
// Stock Adjustment Tests
// ====================================================================
func setupStockAdjustmentRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.POST("/stock-adjustments", CreateStockAdjustment)
	r.GET("/stock-adjustments", ListStockAdjustments)
	r.GET("/stock-adjustments/product/:id", GetStockAdjustmentsByProduct)

	return r
}

func TestCreateStockAdjustment_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	tests := []struct {
		name         string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Empty body",
			body:         `{}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing product_id",
			body:         `{"adjustment_quantity":10,"reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing adjustment_quantity",
			body:         `{"product_id":"` + uuid.NewString() + `","reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing reason",
			body:         `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":10}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Zero adjustment quantity",
			body:         `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":0,"reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Adjustment quantity cannot be zero",
		},
		{
			name:         "Invalid reason",
			body:         `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":10,"reason":"invalid"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid reason",
		},
		{
			name:         "Invalid product_id format",
			body:         `{"product_id":"not-a-uuid","adjustment_quantity":10,"reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid product ID",
		},
		{
			name:         "Malformed JSON",
			body:         `{invalid`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/stock-adjustments", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

func TestCreateStockAdjustment_NonExistentProduct(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	body := `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":10,"reason":"correction"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/stock-adjustments", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "Product not found")
}

func TestListStockAdjustments_PaginationParams(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	tests := []struct {
		name     string
		queryStr string
		expectOK bool
	}{
		{"Default pagination", "", true},
		{"Custom limit and offset", "?limit=10&offset=0", true},
		{"Negative limit", "?limit=-1&offset=0", true},
		{"Very large limit", "?limit=9999&offset=0", true},
		{"Negative offset", "?limit=10&offset=-5", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/stock-adjustments"+tt.queryStr, nil)
			router.ServeHTTP(w, req)

			if tt.expectOK {
				assert.NotEqual(t, http.StatusInternalServerError, w.Code,
					"Pagination should not cause server error. Body: %s", w.Body.String())
			}
		})
	}
}

func TestGetStockAdjustmentsByProduct_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/stock-adjustments/product/not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid product ID")
}

// ====================================================================
// Stock Movement Tests
// ====================================================================
func setupStockMovementRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.GET("/stock-movements", ListStockMovements)
	r.GET("/stock-movements/product/:id", GetStockMovementsByProduct)
	r.GET("/stock-movements/product/:id/summary", GetStockMovementSummary)

	return r
}

func TestListStockMovements_PaginationParams(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockMovementRouter(storeID)

	tests := []struct {
		name     string
		queryStr string
		expectOK bool
	}{
		{"Default pagination", "", true},
		{"Custom limit and offset", "?limit=10&offset=0", true},
		{"Negative limit", "?limit=-1&offset=0", true},
		{"Very large limit", "?limit=9999&offset=0", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/stock-movements"+tt.queryStr, nil)
			router.ServeHTTP(w, req)

			if tt.expectOK {
				assert.NotEqual(t, http.StatusInternalServerError, w.Code,
					"Pagination should not cause server error. Body: %s", w.Body.String())
			}
		})
	}
}

func TestGetStockMovementsByProduct_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockMovementRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/stock-movements/product/not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid product ID")
}

func TestGetStockMovementSummary_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockMovementRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/stock-movements/product/not-a-uuid/summary", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid product ID")
}

// ====================================================================
// Inventory Report Tests
// ====================================================================
func setupInventoryReportRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.GET("/inventory-reports/valuation", GetInventoryValuation)
	r.GET("/inventory-reports/low-stock", GetLowStockReport)
	r.GET("/inventory-reports/expiring", GetExpiringProductsReport)

	return r
}

func TestGetInventoryValuation_ResponseFormat(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupInventoryReportRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/inventory-reports/valuation", nil)
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON. Got: %s", w.Body.String())

	assert.NotEmpty(t, resp.Message)
}

func TestGetLowStockReport_ResponseFormat(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupInventoryReportRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/inventory-reports/low-stock", nil)
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON. Got: %s", w.Body.String())

	assert.NotEmpty(t, resp.Message)
}

func TestGetExpiringProductsReport_ResponseFormat(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupInventoryReportRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/inventory-reports/expiring", nil)
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON. Got: %s", w.Body.String())

	assert.NotEmpty(t, resp.Message)
}
```

- [ ] **Step 2: Run the tests**

Run: `cd backend && go test ./handlers/ -v -run "TestCreateStockAdjustment|TestListStockAdjustments|TestGetStockAdjustments|TestListStockMovements|TestGetStockMovements|TestGetStockMovementSummary|TestGetInventoryValuation|TestGetLowStockReport|TestGetExpiringProductsReport"`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add backend/handlers/inventory_test.go
git commit -m "test: add unit tests for stock adjustment, movement, and inventory report handlers"
```

---

## Task 9: Run Full Test Suite and Verify

- [ ] **Step 1: Run all tests**

Run: `cd backend && go test ./... -v`
Expected: All tests pass

- [ ] **Step 2: Run linter**

Run: `cd backend && golangci-lint run` (or your preferred linter)
Expected: No errors

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve any lint or test issues"
```

---

## Summary

| Feature | Files Created/Modified |
|---------|----------------------|
| Stock Adjustments Schema | `db/schema/16_stock_adjustments.sql` |
| Stock Adjustment Queries | `db/query/stock_adjustments.sql` |
| Inventory Report Queries | `db/query/inventory_reports.sql` |
| Stock Adjustment Handler | `handlers/stock_adjustment.handler.go` |
| Stock Movement Handler | `handlers/stock_movement.handler.go` |
| Inventory Reports Handler | `handlers/inventory_reports.handler.go` |
| Route Registration | `main.go` |
| Unit Tests | `handlers/inventory_test.go` |

**New API Endpoints:**
- `POST /api/stock-adjustments` - Create stock adjustment
- `GET /api/stock-adjustments` - List adjustments
- `GET /api/stock-adjustments/product/:id` - Adjustments by product
- `GET /api/stock-movements` - List movements
- `GET /api/stock-movements/product/:id` - Movements by product
- `GET /api/stock-movements/product/:id/summary` - Movement summary
- `GET /api/inventory-reports/valuation` - Full valuation report
- `GET /api/inventory-reports/low-stock` - Low stock report
- `GET /api/inventory-reports/expiring` - Expiring products report
