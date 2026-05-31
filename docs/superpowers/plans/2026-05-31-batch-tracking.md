# Batch/Lot Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add simple batch tracking to products with batch number, manufacturing date, expiry date, and quantity.

**Architecture:** New `product_batches` table stores batch information per product. Batches are additional info - they don't replace the existing `stock_quantity` on products.

**Tech Stack:** Go, Gin, SQLC, PostgreSQL, React, TypeScript, TanStack Query

---

## File Structure

| File | Purpose |
|------|---------|
| `backend/db/schema/17_product_batches.sql` | Schema for product_batches table |
| `backend/db/migration/20260531000002_create_product_batches.sql` | Migration for new table |
| `backend/db/query/product_batches.sql` | SQLC queries for batches |
| `backend/handlers/product_batches.handler.go` | Handler for batch CRUD |
| `backend/main.go` | Register new routes |
| `frontend/src/services/inventory.ts` | Add batch service functions |
| `frontend/src/pages/Inventory.tsx` | Add batch UI to edit dialog |

---

## Task 1: Create Schema and Migration

**Files:**
- Create: `backend/db/schema/17_product_batches.sql`
- Create: `backend/db/migration/20260531000002_create_product_batches.sql`

- [ ] **Step 1: Create the schema file**

```sql
CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    quantity INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_product_batch UNIQUE (product_id, batch_number)
);

CREATE INDEX idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);
```

- [ ] **Step 2: Create the migration file**

```sql
-- +goose Up

CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    quantity INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_product_batch UNIQUE (product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry ON product_batches(expiry_date);

-- +goose Down

DROP INDEX IF EXISTS idx_product_batches_expiry;
DROP INDEX IF EXISTS idx_product_batches_product_id;
DROP TABLE IF EXISTS product_batches;
```

- [ ] **Step 3: Run migration**

Run the migration on the database to create the table.

- [ ] **Step 4: Commit**

```bash
git add backend/db/schema/17_product_batches.sql backend/db/migration/20260531000002_create_product_batches.sql
git commit -m "feat: add product_batches schema and migration"
```

---

## Task 2: Write SQLC Queries

**Files:**
- Create: `backend/db/query/product_batches.sql`

- [ ] **Step 1: Create the query file**

```sql
-- name: CreateProductBatch :one
INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity, notes)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListProductBatches :many
SELECT * FROM product_batches
WHERE product_id = $1
ORDER BY created_at DESC;

-- name: GetProductBatch :one
SELECT * FROM product_batches
WHERE id = $1 AND product_id = $2;

-- name: UpdateProductBatch :one
UPDATE product_batches
SET 
    batch_number = COALESCE($3, batch_number),
    manufacturing_date = $4,
    expiry_date = $5,
    quantity = COALESCE($6, quantity),
    notes = $7,
    updated_at = NOW()
WHERE id = $1 AND product_id = $2
RETURNING *;

-- name: DeleteProductBatch :exec
DELETE FROM product_batches
WHERE id = $1 AND product_id = $2;

-- name: GetExpiringBatches :many
SELECT pb.*, p.name as product_name
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE p.store_id = $1 
    AND pb.expiry_date IS NOT NULL 
    AND pb.expiry_date <= NOW() + INTERVAL '30 days'
    AND pb.quantity > 0
ORDER BY pb.expiry_date ASC;
```

- [ ] **Step 2: Generate SQLC code**

Run: `cd backend && make sqlc`

- [ ] **Step 3: Commit**

```bash
git add backend/db/query/product_batches.sql backend/db/sqlc/
git commit -m "feat: add SQLC queries for product batches"
```

---

## Task 3: Create Handler

**Files:**
- Create: `backend/handlers/product_batches.handler.go`

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
    "github.com/jackc/pgx/v5/pgtype"
)

type createProductBatchReq struct {
    BatchNumber        string  `json:"batch_number" binding:"required"`
    ManufacturingDate  string  `json:"manufacturing_date"`
    ExpiryDate         string  `json:"expiry_date"`
    Quantity           int32   `json:"quantity" binding:"required"`
    Notes              string  `json:"notes"`
}

func ListProductBatches(c *gin.Context) {
    storeID, ok := utils.GetStoreID(c)
    if !ok {
        utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
        return
    }

    productID, err := utils.ParseUUID(c.Param("id"))
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid product id", err)
        return
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
    defer cancel()

    // Verify product belongs to store
    _, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
        ID:      productID,
        StoreID: storeID,
    })
    if err != nil {
        utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
        return
    }

    batches, err := utils.Queries.ListProductBatches(ctx, productID)
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch batches", err)
        return
    }

    if batches == nil {
        batches = []db.ProductBatch{}
    }

    utils.SuccessResponse(c, "batches fetched successfully", batches)
}

func CreateProductBatch(c *gin.Context) {
    storeID, ok := utils.GetStoreID(c)
    if !ok {
        utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
        return
    }

    productID, err := utils.ParseUUID(c.Param("id"))
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid product id", err)
        return
    }

    var req createProductBatchReq
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
        return
    }

    if req.Quantity < 0 {
        utils.ErrorResponse(c, http.StatusBadRequest, "quantity cannot be negative", nil)
        return
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    // Verify product belongs to store
    _, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
        ID:      productID,
        StoreID: storeID,
    })
    if err != nil {
        utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
        return
    }

    var manufacturingDate pgtype.Date
    if req.ManufacturingDate != "" {
        t, err := time.Parse("2006-01-02", req.ManufacturingDate)
        if err == nil {
            manufacturingDate = pgtype.Date{Time: t, Valid: true}
        }
    }

    var expiryDate pgtype.Date
    if req.ExpiryDate != "" {
        t, err := time.Parse("2006-01-02", req.ExpiryDate)
        if err == nil {
            expiryDate = pgtype.Date{Time: t, Valid: true}
        }
    }

    batch, err := utils.Queries.CreateProductBatch(ctx, db.CreateProductBatchParams{
        ProductID:          productID,
        BatchNumber:        req.BatchNumber,
        ManufacturingDate:  manufacturingDate,
        ExpiryDate:         expiryDate,
        Quantity:           req.Quantity,
        Notes:              utils.OptionalText(req.Notes),
    })
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create batch", err)
        return
    }

    utils.SuccessResponse(c, "batch created successfully", batch)
}

func UpdateProductBatch(c *gin.Context) {
    storeID, ok := utils.GetStoreID(c)
    if !ok {
        utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
        return
    }

    productID, err := utils.ParseUUID(c.Param("id"))
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid product id", err)
        return
    }

    batchID, err := utils.ParseUUID(c.Param("batchId"))
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid batch id", err)
        return
    }

    var req createProductBatchReq
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
        return
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    // Verify product belongs to store
    _, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
        ID:      productID,
        StoreID: storeID,
    })
    if err != nil {
        utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
        return
    }

    var manufacturingDate pgtype.Date
    if req.ManufacturingDate != "" {
        t, err := time.Parse("2006-01-02", req.ManufacturingDate)
        if err == nil {
            manufacturingDate = pgtype.Date{Time: t, Valid: true}
        }
    }

    var expiryDate pgtype.Date
    if req.ExpiryDate != "" {
        t, err := time.Parse("2006-01-02", req.ExpiryDate)
        if err == nil {
            expiryDate = pgtype.Date{Time: t, Valid: true}
        }
    }

    batch, err := utils.Queries.UpdateProductBatch(ctx, db.UpdateProductBatchParams{
        ID:                  batchID,
        ProductID:           productID,
        BatchNumber:         req.BatchNumber,
        ManufacturingDate:   manufacturingDate,
        ExpiryDate:          expiryDate,
        Quantity:            req.Quantity,
        Notes:               utils.OptionalText(req.Notes),
    })
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "failed to update batch", err)
        return
    }

    utils.SuccessResponse(c, "batch updated successfully", batch)
}

func DeleteProductBatch(c *gin.Context) {
    storeID, ok := utils.GetStoreID(c)
    if !ok {
        utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
        return
    }

    productID, err := utils.ParseUUID(c.Param("id"))
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid product id", err)
        return
    }

    batchID, err := utils.ParseUUID(c.Param("batchId"))
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "invalid batch id", err)
        return
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
    defer cancel()

    // Verify product belongs to store
    _, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
        ID:      productID,
        StoreID: storeID,
    })
    if err != nil {
        utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
        return
    }

    err = utils.Queries.DeleteProductBatch(ctx, db.DeleteProductBatchParams{
        ID:        batchID,
        ProductID: productID,
    })
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "failed to delete batch", err)
        return
    }

    utils.SuccessResponse(c, "batch deleted successfully", nil)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./...`

- [ ] **Step 3: Commit**

```bash
git add backend/handlers/product_batches.handler.go
git commit -m "feat: add product batches handler"
```

---

## Task 4: Register Routes

**Files:**
- Modify: `backend/main.go`

- [ ] **Step 1: Add routes to main.go**

Add after the existing product routes (around line 134):

```go
// Product batch routes
batchRoutes := router.Group("/api/products/:id/batches")
batchRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
{
    batchRoutes.GET("", handlers.ListProductBatches)
    batchRoutes.POST("", handlers.CreateProductBatch)
    batchRoutes.PUT("/:batchId", handlers.UpdateProductBatch)
    batchRoutes.DELETE("/:batchId", handlers.DeleteProductBatch)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./...`

- [ ] **Step 3: Commit**

```bash
git add backend/main.go
git commit -m "feat: register product batch routes"
```

---

## Task 5: Add Frontend Service Functions

**Files:**
- Modify: `frontend/src/services/inventory.ts`

- [ ] **Step 1: Add TypeScript interface**

Add to `frontend/src/services/inventory.ts` after the existing interfaces:

```typescript
export interface ProductBatch {
    id: string;
    product_id: string;
    batch_number: string;
    manufacturing_date?: string;
    expiry_date?: string;
    quantity: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProductBatchData {
    batch_number: string;
    manufacturing_date?: string;
    expiry_date?: string;
    quantity: number;
    notes?: string;
}
```

- [ ] **Step 2: Add service functions**

Add to `inventoryService` object:

```typescript
// Product Batches
listProductBatches: async (productId: string) => {
    try {
        const response = await api.get(`products/${productId}/batches`);
        return response.data.data || [];
    } catch (error) {
        console.warn('[Inventory] Failed to fetch batches', error);
        return [];
    }
},

createProductBatch: async (productId: string, data: CreateProductBatchData) => {
    const response = await api.post(`products/${productId}/batches`, data);
    return response.data.data;
},

updateProductBatch: async (productId: string, batchId: string, data: CreateProductBatchData) => {
    const response = await api.put(`products/${productId}/batches/${batchId}`, data);
    return response.data.data;
},

deleteProductBatch: async (productId: string, batchId: string) => {
    await api.delete(`products/${productId}/batches/${batchId}`);
},
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/inventory.ts
git commit -m "feat: add product batch service functions"
```

---

## Task 6: Add Batch UI to Product Edit Dialog

**Files:**
- Modify: `frontend/src/pages/Inventory.tsx`

- [ ] **Step 1: Add imports and state**

Add to imports:

```tsx
import { ProductBatch, CreateProductBatchData } from "@/services/inventory";
```

Add state variables after existing state:

```tsx
const [batches, setBatches] = useState<ProductBatch[]>([]);
const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
const [batchDialogOpen, setBatchDialogOpen] = useState(false);
const [batchForm, setBatchForm] = useState<CreateProductBatchData>({
    batch_number: "",
    quantity: 0,
});
```

- [ ] **Step 2: Add batch loading effect**

Add useEffect to load batches when editing product:

```tsx
useEffect(() => {
    if (editingProduct && addDialogOpen) {
        inventoryService.listProductBatches(editingProduct.id).then(setBatches);
    }
}, [editingProduct, addDialogOpen]);
```

- [ ] **Step 3: Add batch section to edit dialog**

Add after the warranty section in the edit dialog form:

```tsx
{/* Batches Section */}
{editingProduct && (
    <div className="space-y-4 pt-4 border-t border-[#1A1A1A]">
        <div className="flex items-center justify-between">
            <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Batches</label>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                    setEditingBatch(null);
                    setBatchForm({ batch_number: "", quantity: 0 });
                    setBatchDialogOpen(true);
                }}
                className="h-7 text-[10px] border-[#1A1A1A] text-[#888888]"
            >
                <Plus className="h-3 w-3 mr-1" />
                Add Batch
            </Button>
        </div>
        
        {batches.length > 0 ? (
            <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                            <TableHead className="text-[10px] text-[#888888] uppercase">Batch #</TableHead>
                            <TableHead className="text-[10px] text-[#888888] uppercase">Mfg Date</TableHead>
                            <TableHead className="text-[10px] text-[#888888] uppercase">Expiry</TableHead>
                            <TableHead className="text-[10px] text-[#888888] uppercase text-right">Qty</TableHead>
                            <TableHead className="text-[10px] text-[#888888] uppercase text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.map((batch) => (
                            <TableRow key={batch.id} className="border-b border-[#1A1A1A]">
                                <TableCell className="text-[11px] text-white">{batch.batch_number}</TableCell>
                                <TableCell className="text-[11px] text-[#888888]">
                                    {batch.manufacturing_date || "—"}
                                </TableCell>
                                <TableCell className="text-[11px] text-[#888888]">
                                    {batch.expiry_date || "—"}
                                </TableCell>
                                <TableCell className="text-[11px] text-white text-right">{batch.quantity}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => {
                                            setEditingBatch(batch);
                                            setBatchForm({
                                                batch_number: batch.batch_number,
                                                manufacturing_date: batch.manufacturing_date,
                                                expiry_date: batch.expiry_date,
                                                quantity: batch.quantity,
                                                notes: batch.notes,
                                            });
                                            setBatchDialogOpen(true);
                                        }}
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-[#DA291C]"
                                        onClick={async () => {
                                            if (editingProduct) {
                                                await inventoryService.deleteProductBatch(editingProduct.id, batch.id);
                                                setBatches(batches.filter(b => b.id !== batch.id));
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : (
            <p className="text-[11px] text-[#555555]">No batches added yet.</p>
        )}
    </div>
)}
```

- [ ] **Step 4: Add batch dialog**

Add before the closing `</DialogContent>` of the edit dialog:

```tsx
{/* Batch Dialog */}
<Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
    <DialogContent className="max-w-md bg-[#0A0A0A] border border-[#1A1A1A]">
        <DialogHeader>
            <DialogTitle className="text-white">
                {editingBatch ? "Edit Batch" : "Add Batch"}
            </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-[#888888]">Batch Number *</Label>
                <Input
                    value={batchForm.batch_number}
                    onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                    placeholder="e.g., BATCH-001"
                    className="bg-[#111111] border-[#1A1A1A] text-white"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label className="text-[#888888]">Mfg Date</Label>
                    <Input
                        type="date"
                        value={batchForm.manufacturing_date || ""}
                        onChange={(e) => setBatchForm({ ...batchForm, manufacturing_date: e.target.value })}
                        className="bg-[#111111] border-[#1A1A1A] text-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[#888888]">Expiry Date</Label>
                    <Input
                        type="date"
                        value={batchForm.expiry_date || ""}
                        onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                        className="bg-[#111111] border-[#1A1A1A] text-white"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[#888888]">Quantity *</Label>
                <Input
                    type="number"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: parseInt(e.target.value) || 0 })}
                    className="bg-[#111111] border-[#1A1A1A] text-white"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-[#888888]">Notes</Label>
                <Input
                    value={batchForm.notes || ""}
                    onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                    placeholder="Optional notes..."
                    className="bg-[#111111] border-[#1A1A1A] text-white"
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                type="button"
                variant="outline"
                onClick={() => setBatchDialogOpen(false)}
                className="border-[#1A1A1A] text-[#888888]"
            >
                Cancel
            </Button>
            <Button
                type="button"
                onClick={async () => {
                    if (!batchForm.batch_number || !editingProduct) return;
                    
                    if (editingBatch) {
                        await inventoryService.updateProductBatch(editingProduct.id, editingBatch.id, batchForm);
                    } else {
                        await inventoryService.createProductBatch(editingProduct.id, batchForm);
                    }
                    
                    const updatedBatches = await inventoryService.listProductBatches(editingProduct.id);
                    setBatches(updatedBatches);
                    setBatchDialogOpen(false);
                }}
                className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
            >
                {editingBatch ? "Update" : "Add"} Batch
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Inventory.tsx
git commit -m "feat: add batch UI to product edit dialog"
```

---

## Summary

| Task | Files Created/Modified |
|------|----------------------|
| 1 | `backend/db/schema/17_product_batches.sql`, `backend/db/migration/20260531000002_create_product_batches.sql` |
| 2 | `backend/db/query/product_batches.sql`, `backend/db/sqlc/` |
| 3 | `backend/handlers/product_batches.handler.go` |
| 4 | `backend/main.go` |
| 5 | `frontend/src/services/inventory.ts` |
| 6 | `frontend/src/pages/Inventory.tsx` |

**New API Endpoints:**
- `GET /api/products/:id/batches` - List batches
- `POST /api/products/:id/batches` - Create batch
- `PUT /api/products/:id/batches/:batchId` - Update batch
- `DELETE /api/products/:id/batches/:batchId` - Delete batch
