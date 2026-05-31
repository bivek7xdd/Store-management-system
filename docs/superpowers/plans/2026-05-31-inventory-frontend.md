# Inventory Frontend Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stock adjustment and stock movement history features to the existing Inventory page via tabs.

**Architecture:** Extend the existing `Inventory.tsx` page with a tabbed interface. Add new service functions for the backend APIs created in the backend implementation.

**Tech Stack:** React, TypeScript, Tailwind CSS, TanStack Query, shadcn/ui components

---

## File Structure

| File | Purpose |
|------|---------|
| `frontend/src/services/inventory.ts` | Add service functions for stock adjustments and movements |
| `frontend/src/components/inventory/StockAdjustmentDialog.tsx` | Dialog to create stock adjustments |
| `frontend/src/components/inventory/StockAdjustmentTable.tsx` | Table showing adjustment history |
| `frontend/src/components/inventory/StockMovementTable.tsx` | Table showing movement history |
| `frontend/src/pages/Inventory.tsx` | Add tabs to switch between Products, Adjustments, Movements |

---

## Task 1: Add Service Functions

**Files:**
- Modify: `frontend/src/services/inventory.ts`

- [ ] **Step 1: Add TypeScript interfaces for stock adjustments and movements**

Add to `frontend/src/services/inventory.ts` after the existing interfaces:

```typescript
export interface StockAdjustment {
    id: string;
    store_id: string;
    product_id: string;
    variant_id?: string;
    adjustment_quantity: number;
    previous_quantity: number;
    new_quantity: number;
    reason: string;
    notes?: string;
    adjusted_by?: string;
    created_at: string;
    product_name?: string;
}

export interface StockMovement {
    id: string;
    store_id: string;
    product_id: string;
    variant_id?: string;
    movement_type: string;
    quantity_change: number;
    reference_id?: string;
    reference_type?: string;
    notes?: string;
    created_at: string;
    product_name?: string;
}

export interface CreateStockAdjustmentData {
    product_id: string;
    adjustment_quantity: number;
    reason: string;
    notes?: string;
}
```

- [ ] **Step 2: Add stock adjustment service functions**

Add to `inventoryService` object in `frontend/src/services/inventory.ts`:

```typescript
// Stock Adjustments
createStockAdjustment: async (data: CreateStockAdjustmentData) => {
    const response = await api.post('stock-adjustments', data);
    return response.data.data;
},

listStockAdjustments: async (limit = 50, offset = 0) => {
    const response = await api.get(`stock-adjustments?limit=${limit}&offset=${offset}`);
    return response.data.data || [];
},

getStockAdjustmentsByProduct: async (productId: string, limit = 50, offset = 0) => {
    const response = await api.get(`stock-adjustments/product/${productId}?limit=${limit}&offset=${offset}`);
    return response.data.data || [];
},

// Stock Movements
listStockMovements: async (limit = 50, offset = 0) => {
    const response = await api.get(`stock-movements?limit=${limit}&offset=${offset}`);
    return response.data.data || [];
},

getStockMovementsByProduct: async (productId: string, limit = 50, offset = 0) => {
    const response = await api.get(`stock-movements/product/${productId}?limit=${limit}&offset=${offset}`);
    return response.data.data || [];
},

getStockMovementSummary: async (productId: string) => {
    const response = await api.get(`stock-movements/product/${productId}/summary`);
    return response.data.data;
},
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/inventory.ts
git commit -m "feat: add stock adjustment and movement service functions"
```

---

## Task 2: Create StockAdjustmentDialog Component

**Files:**
- Create: `frontend/src/components/inventory/StockAdjustmentDialog.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, CreateStockAdjustmentData } from "@/services/inventory";
import { Product } from "@/types";

interface StockAdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
}

const REASONS = [
    { value: "physical_count", label: "Physical Count" },
    { value: "damaged", label: "Damaged" },
    { value: "expired", label: "Expired" },
    { value: "theft", label: "Theft" },
    { value: "correction", label: "Correction" },
    { value: "return", label: "Return" },
    { value: "other", label: "Other" },
];

export function StockAdjustmentDialog({ open, onOpenChange, products }: StockAdjustmentDialogProps) {
    const [productId, setProductId] = useState("");
    const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: CreateStockAdjustmentData) => inventoryService.createStockAdjustment(data),
        onSuccess: () => {
            toast.success("Stock adjustment created successfully");
            onOpenChange(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create adjustment");
        },
    });

    const resetForm = () => {
        setProductId("");
        setAdjustmentQuantity("");
        setReason("");
        setNotes("");
        setFormErrors({});
    };

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!productId) errors.product_id = "product is required";
        if (!adjustmentQuantity || parseInt(adjustmentQuantity) === 0) {
            errors.adjustment_quantity = "quantity cannot be zero";
        }
        if (!reason) errors.reason = "reason is required";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        createMutation.mutate({
            product_id: productId,
            adjustment_quantity: parseInt(adjustmentQuantity),
            reason,
            notes: notes || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#0A0A0A] border border-[#1A1A1A]">
                <DialogHeader>
                    <DialogTitle className="text-white">Create Stock Adjustment</DialogTitle>
                    <DialogDescription className="text-[#888888]">
                        Adjust stock quantity for a product. Use positive numbers to add stock, negative to remove.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[#888888]">Product *</Label>
                        <Select value={productId} onValueChange={setProductId}>
                            <SelectTrigger className="bg-[#111111] border-[#1A1A1A] text-white">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111111] border-[#1A1A1A]">
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id} className="text-white">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.product_id && (
                            <p className="text-[11px] text-[#DA291C]">{formErrors.product_id}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[#888888]">Adjustment Quantity *</Label>
                        <Input
                            type="number"
                            value={adjustmentQuantity}
                            onChange={(e) => setAdjustmentQuantity(e.target.value)}
                            placeholder="+10 to add, -5 to remove"
                            className="bg-[#111111] border-[#1A1A1A] text-white"
                        />
                        {formErrors.adjustment_quantity && (
                            <p className="text-[11px] text-[#DA291C]">{formErrors.adjustment_quantity}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[#888888]">Reason *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className="bg-[#111111] border-[#1A1A1A] text-white">
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111111] border-[#1A1A1A]">
                                {REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value} className="text-white">
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.reason && (
                            <p className="text-[11px] text-[#DA291C]">{formErrors.reason}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[#888888]">Notes (optional)</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes..."
                            className="bg-[#111111] border-[#1A1A1A] text-white"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-[#1A1A1A] text-[#888888]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Create Adjustment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/inventory/StockAdjustmentDialog.tsx
git commit -m "feat: add StockAdjustmentDialog component"
```

---

## Task 3: Create StockAdjustmentTable Component

**Files:**
- Create: `frontend/src/components/inventory/StockAdjustmentTable.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { inventoryService, StockAdjustment } from "@/services/inventory";
import { format } from "date-fns";

interface StockAdjustmentTableProps {
    refreshKey?: number;
}

const REASON_LABELS: Record<string, string> = {
    physical_count: "Physical Count",
    damaged: "Damaged",
    expired: "Expired",
    theft: "Theft",
    correction: "Correction",
    return: "Return",
    other: "Other",
};

export function StockAdjustmentTable({ refreshKey }: StockAdjustmentTableProps) {
    const { data: adjustments = [], isLoading } = useQuery({
        queryKey: ["stockAdjustments", refreshKey],
        queryFn: () => inventoryService.listStockAdjustments(100, 0),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    if (adjustments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#1A1A1A] rounded-[2px]">
                <Package className="h-8 w-8 text-[#303030] mb-4" />
                <p className="text-[14px] font-medium text-white mb-1">No adjustments yet</p>
                <p className="text-[12px] text-[#888888]">
                    Stock adjustments will appear here when you create them.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Date</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Product</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Quantity</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Previous</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">New</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Reason</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {adjustments.map((adj: StockAdjustment) => (
                        <TableRow key={adj.id} className="border-b border-[#1A1A1A] hover:bg-[#0D0D0D]">
                            <TableCell className="text-[12px] text-[#CCCCCC]">
                                {format(new Date(adj.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-[12px] text-white font-medium">
                                {adj.product_name}
                            </TableCell>
                            <TableCell>
                                <span
                                    className={`text-[12px] font-bold ${
                                        adj.adjustment_quantity > 0 ? "text-emerald-400" : "text-[#DA291C]"
                                    }`}
                                >
                                    {adj.adjustment_quantity > 0 ? "+" : ""}
                                    {adj.adjustment_quantity}
                                </span>
                            </TableCell>
                            <TableCell className="text-[12px] text-[#888888]">
                                {adj.previous_quantity}
                            </TableCell>
                            <TableCell className="text-[12px] text-white">
                                {adj.new_quantity}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    className="bg-[#1A1A1A] text-[#CCCCCC] text-[10px] uppercase"
                                >
                                    {REASON_LABELS[adj.reason] || adj.reason}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-[12px] text-[#888888] max-w-[150px] truncate">
                                {adj.notes || "—"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/inventory/StockAdjustmentTable.tsx
git commit -m "feat: add StockAdjustmentTable component"
```

---

## Task 4: Create StockMovementTable Component

**Files:**
- Create: `frontend/src/components/inventory/StockMovementTable.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { inventoryService, StockMovement } from "@/services/inventory";
import { format } from "date-fns";

const MOVEMENT_TYPES = [
    { value: "all", label: "All Types" },
    { value: "sale", label: "Sale" },
    { value: "purchase", label: "Purchase" },
    { value: "adjustment", label: "Adjustment" },
    { value: "return", label: "Return" },
];

const TYPE_COLORS: Record<string, string> = {
    sale: "bg-amber-500/10 text-amber-400",
    purchase: "bg-emerald-500/10 text-emerald-400",
    adjustment: "bg-blue-500/10 text-blue-400",
    return: "bg-purple-500/10 text-purple-400",
};

export function StockMovementTable() {
    const [typeFilter, setTypeFilter] = useState("all");

    const { data: movements = [], isLoading } = useQuery({
        queryKey: ["stockMovements"],
        queryFn: () => inventoryService.listStockMovements(100, 0),
    });

    const filteredMovements = typeFilter === "all"
        ? movements
        : movements.filter((m: StockMovement) => m.movement_type === typeFilter);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    if (movements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#1A1A1A] rounded-[2px]">
                <Package className="h-8 w-8 text-[#303030] mb-4" />
                <p className="text-[14px] font-medium text-white mb-1">No movements yet</p>
                <p className="text-[12px] text-[#888888]">
                    Stock movements will appear here as products are sold and received.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px] bg-[#111111] border-[#1A1A1A] text-white">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#1A1A1A]">
                        {MOVEMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-white">
                                {t.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Date</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Product</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Type</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Quantity</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Reference</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMovements.map((mov: StockMovement) => (
                            <TableRow key={mov.id} className="border-b border-[#1A1A1A] hover:bg-[#0D0D0D]">
                                <TableCell className="text-[12px] text-[#CCCCCC]">
                                    {format(new Date(mov.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-[12px] text-white font-medium">
                                    {mov.product_name}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={`text-[10px] uppercase ${TYPE_COLORS[mov.movement_type] || "bg-[#1A1A1A] text-[#888888]"}`}
                                    >
                                        {mov.movement_type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`text-[12px] font-bold ${
                                            mov.quantity_change > 0 ? "text-emerald-400" : "text-[#DA291C]"
                                        }`}
                                    >
                                        {mov.quantity_change > 0 ? "+" : ""}
                                        {mov.quantity_change}
                                    </span>
                                </TableCell>
                                <TableCell className="text-[12px] text-[#888888]">
                                    {mov.reference_type ? `${mov.reference_type}` : "—"}
                                </TableCell>
                                <TableCell className="text-[12px] text-[#888888] max-w-[150px] truncate">
                                    {mov.notes || "—"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/inventory/StockMovementTable.tsx
git commit -m "feat: add StockMovementTable component"
```

---

## Task 5: Add Tabs to Inventory Page

**Files:**
- Modify: `frontend/src/pages/Inventory.tsx`

- [ ] **Step 1: Add Tabs import and state**

Add to imports at top of `Inventory.tsx`:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { StockAdjustmentTable } from "@/components/inventory/StockAdjustmentTable";
import { StockMovementTable } from "@/components/inventory/StockMovementTable";
```

Add state variable after existing state declarations (around line 128):

```tsx
const [activeTab, setActiveTab] = useState("products");
const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
const [adjustmentRefreshKey, setAdjustmentRefreshKey] = useState(0);
```

- [ ] **Step 2: Add Tabs UI to the page**

Replace the products table section (starting around line 1170) with tabs:

```tsx
{/* Main Content Tabs */}
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
    <TabsList className="bg-[#111111] border border-[#1A1A1A] p-1">
        <TabsTrigger value="products" className="data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">
            Products
        </TabsTrigger>
        <TabsTrigger value="adjustments" className="data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">
            Adjustments
        </TabsTrigger>
        <TabsTrigger value="movements" className="data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">
            Movements
        </TabsTrigger>
    </TabsList>

    <TabsContent value="products" className="space-y-4">
        {/* Existing products table */}
        <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden" data-tour="inventory-grid">
            {/* ... existing table code ... */}
        </div>
    </TabsContent>

    <TabsContent value="adjustments" className="space-y-4">
        <div className="flex justify-end">
            <Button
                onClick={() => setAdjustmentDialogOpen(true)}
                className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
            >
                <Plus className="h-4 w-4 mr-2" />
                Create Adjustment
            </Button>
        </div>
        <StockAdjustmentTable refreshKey={adjustmentRefreshKey} />
    </TabsContent>

    <TabsContent value="movements">
        <StockMovementTable />
    </TabsContent>
</Tabs>

<StockAdjustmentDialog
    open={adjustmentDialogOpen}
    onOpenChange={setAdjustmentDialogOpen}
    products={productsList}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Inventory.tsx
git commit -m "feat: add tabs for products, adjustments, and movements"
```

---

## Task 6: Install date-fns Dependency

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install date-fns**

Run: `cd frontend && bun add date-fns`
Expected: date-fns added to package.json

- [ ] **Step 2: Verify build works**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/bun.lockb
git commit -m "chore: add date-fns dependency"
```

---

## Summary

| Task | Files Created/Modified |
|------|----------------------|
| 1 | `frontend/src/services/inventory.ts` (modified) |
| 2 | `frontend/src/components/inventory/StockAdjustmentDialog.tsx` (created) |
| 3 | `frontend/src/components/inventory/StockAdjustmentTable.tsx` (created) |
| 4 | `frontend/src/components/inventory/StockMovementTable.tsx` (created) |
| 5 | `frontend/src/pages/Inventory.tsx` (modified) |
| 6 | `frontend/package.json` (modified) |

**New UI Features:**
- Tabs on Inventory page (Products, Adjustments, Movements)
- Create Stock Adjustment dialog
- Stock adjustment history table
- Stock movement history table with type filter
