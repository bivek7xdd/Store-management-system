# Finance Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate 4 standalone finance pages into a single tabbed Finance page under Reports, removing sidebar clutter.

**Architecture:** Create a new `Finance.tsx` page with 4 tabs (Expenses, Payables, Cash Flow, Balance Sheet) by migrating existing page content. Update routing and sidebar to point to the new page. Delete old files.

**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, shadcn/ui Tabs, Recharts

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/pages/Finance.tsx` | **Create** | New consolidated Finance page with 4 tabs |
| `frontend/src/App.tsx` | **Modify** | Add `/reports/finance` route, remove 4 `/finance/*` routes |
| `frontend/src/components/Layout.tsx` | **Modify** | Remove Finance nav item, add Finance under Reports |
| `frontend/src/pages/Reports.tsx` | **Modify** | Replace Finance tab content with summary + link |
| `frontend/src/pages/Expenses.tsx` | **Delete** | Content migrated to Finance page |
| `frontend/src/pages/SupplierPayables.tsx` | **Delete** | Content migrated to Finance page |
| `frontend/src/pages/CashFlow.tsx` | **Delete** | Content migrated to Finance page |
| `frontend/src/pages/BalanceSheet.tsx` | **Delete** | Content migrated to Finance page |
| `frontend/src/components/FinanceSidebarItem.tsx` | **Delete** | Replaced by simple link |

---

### Task 1: Create the new Finance page with Expenses tab

**Files:**
- Create: `frontend/src/pages/Finance.tsx`

- [ ] **Step 1: Read the full Expenses.tsx file to get the complete component code**

Read: `frontend/src/pages/Expenses.tsx` (all 370 lines)

- [ ] **Step 2: Create Finance.tsx with the Expenses tab content**

Create `frontend/src/pages/Finance.tsx`. Start with the tab structure and migrate the Expenses component content into the first tab. The file should:

1. Import all needed dependencies (same as Expenses.tsx plus Tabs components)
2. Define a `FinanceExpenses` sub-component with the full Expenses logic (state, queries, mutations, dialogs, charts, table)
3. Define placeholder components for the other 3 tabs (CashFlowTab, PayablesTab, BalanceSheetTab) that just render a div with "Coming soon"
4. Export a default `Finance` component that renders a page header ("Finance") and a Tabs component with 4 tabs

```tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CreditCard, TrendingUp, PieChart } from "lucide-react";

// --- Expenses Tab (migrated from Expenses.tsx) ---
function FinanceExpenses() {
  // ... exact same code as Expenses() component from Expenses.tsx
  // Copy the entire Expenses component body here
}

// --- Payables Tab (placeholder) ---
function PayablesTab() {
  return <div className="text-[#888888] p-8 text-center">Payables tab - migrating...</div>;
}

// --- Cash Flow Tab (placeholder) ---
function CashFlowTab() {
  return <div className="text-[#888888] p-8 text-center">Cash Flow tab - migrating...</div>;
}

// --- Balance Sheet Tab (placeholder) ---
function BalanceSheetTab() {
  return <div className="text-[#888888] p-8 text-center">Balance Sheet tab - migrating...</div>;
}

export default function Finance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Finance</h1>
        <p className="text-[13px] text-[#888888] mt-1">Manage expenses, payables, cash flow, and balance sheet</p>
      </div>
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses" className="gap-2">
            <Wallet className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="payables" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payables
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="gap-2">
            <PieChart className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <FinanceExpenses />
        </TabsContent>
        <TabsContent value="payables">
          <PayablesTab />
        </TabsContent>
        <TabsContent value="cashflow">
          <CashFlowTab />
        </TabsContent>
        <TabsContent value="balance-sheet">
          <BalanceSheetTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Verify the file compiles**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to Finance.tsx (placeholder tabs are valid JSX)

- [ ] **Step 4: Commit**

```bash
cd /home/wrzzy/Projects/FYP/Store-management-system
git add frontend/src/pages/Finance.tsx
git commit -m "feat: create Finance page with Expenses tab"
```

---

### Task 2: Add route and update App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add Finance import and route to App.tsx**

In `frontend/src/App.tsx`:

1. Add import: `import Finance from "./pages/Finance";`
2. Add route after the Reports route:
```tsx
<Route path="/reports/finance" element={
  <ProtectedRoute>
    <Layout>
      <ErrorBoundary><Finance /></ErrorBoundary>
    </Layout>
  </ProtectedRoute>
} />
```
3. Remove the 4 finance route blocks (lines ~237-262):
   - `/finance/expenses`
   - `/finance/payables`
   - `/finance/cashflow`
   - `/finance/balance-sheet`
4. Remove the 4 imports that are no longer needed:
   - `import Expenses from "./pages/Expenses";`
   - `import SupplierPayables from "./pages/SupplierPayables";`
   - `import CashFlow from "./pages/CashFlow";`
   - `import BalanceSheet from "./pages/BalanceSheet";`

- [ ] **Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add /reports/finance route, remove old /finance/* routes"
```

---

### Task 3: Update sidebar navigation

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Remove Finance from navItems and FinanceSidebarItem import**

In `frontend/src/components/Layout.tsx`:

1. Remove the import: `import { FinanceSidebarItem } from "./FinanceSidebarItem";`
2. Remove this line from `navItems` array:
```ts
{ icon: Wallet, label: "Finance", path: "/finance" },
```

- [ ] **Step 2: Find where FinanceSidebarItem is rendered in the sidebar and remove it**

Search Layout.tsx for `FinanceSidebarItem` usage. Remove the rendered component (it's likely in the sidebar nav section, around lines 200-250). Replace it with a simple link to `/reports/finance` that appears under the Reports section, or remove it entirely since Reports already links to `/reports`.

The simplest approach: just remove the FinanceSidebarItem rendering. The Finance page will be accessible from the Reports page's Finance tab or a direct link.

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: remove Finance sidebar section"
```

---

### Task 4: Migrate SupplierPayables into Finance page

**Files:**
- Read: `frontend/src/pages/SupplierPayables.tsx` (all 366 lines)
- Modify: `frontend/src/pages/Finance.tsx`

- [ ] **Step 1: Read the full SupplierPayables.tsx**

Read: `frontend/src/pages/SupplierPayables.tsx` (all 366 lines)

- [ ] **Step 2: Replace the PayablesTab placeholder in Finance.tsx**

Replace the `PayablesTab` function in `Finance.tsx` with the full SupplierPayables component code. The function should contain all the state, queries, mutations, dialogs, and table from SupplierPayables.tsx.

Add any missing imports to Finance.tsx (e.g., `getSupplierPayables`, `getSupplierPayableSummary`, `createSupplierPayable`, `recordSupplierPayment`, `deleteSupplierPayable`, `SupplierPayable`, `PAYABLE_STATUS_COLORS`, `inventoryService`, `Badge`, `AlertDialog*`).

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Finance.tsx
git commit -m "feat: migrate SupplierPayables into Finance page Payables tab"
```

---

### Task 5: Migrate CashFlow into Finance page

**Files:**
- Read: `frontend/src/pages/CashFlow.tsx` (all 195 lines)
- Modify: `frontend/src/pages/Finance.tsx`

- [ ] **Step 1: Read the full CashFlow.tsx**

Read: `frontend/src/pages/CashFlow.tsx` (all 195 lines)

- [ ] **Step 2: Replace the CashFlowTab placeholder in Finance.tsx**

Replace the `CashFlowTab` function with the full CashFlow component code. Add any missing imports (e.g., `BarChart`, `Bar`, `ComposedChart`, `CartesianGrid`, `LineChart`, `Line`, `api`).

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Finance.tsx
git commit -m "feat: migrate CashFlow into Finance page Cash Flow tab"
```

---

### Task 6: Migrate BalanceSheet into Finance page

**Files:**
- Read: `frontend/src/pages/BalanceSheet.tsx` (all 209 lines)
- Modify: `frontend/src/pages/Finance.tsx`

- [ ] **Step 1: Read the full BalanceSheet.tsx**

Read: `frontend/src/pages/BalanceSheet.tsx` (all 209 lines)

- [ ] **Step 2: Replace the BalanceSheetTab placeholder in Finance.tsx**

Replace the `BalanceSheetTab` function with the full BalanceSheet component code. Add any missing imports (e.g., `PieChart`, `Pie`, `Cell`, `api`).

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Finance.tsx
git commit -m "feat: migrate BalanceSheet into Finance page Balance Sheet tab"
```

---

### Task 7: Update Reports Finance tab to summary + link

**Files:**
- Modify: `frontend/src/pages/Reports.tsx`

- [ ] **Step 1: Read the Reports.tsx Finance tab section**

Read: `frontend/src/pages/Reports.tsx` lines 838-971 (the `<TabsContent value="finance">` block)

- [ ] **Step 2: Replace Finance tab content with summary + link**

Replace the entire `<TabsContent value="finance">` block with a simplified summary that shows key metrics and a "View Full Finance" button linking to `/reports/finance`.

The new Finance tab should show:
- Total Expenses (from expenseSummary)
- Total Outstanding Payables (from payableSummary)
- Net Profit (from stats.profit)
- A "View Full Finance" button linking to `/reports/finance`

```tsx
<TabsContent value="finance" className="space-y-4">
  <div className="grid md:grid-cols-3 gap-4">
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
      <p className="text-[10px] text-[#888888] uppercase tracking-[1px]">Total Expenses</p>
      <p className="text-[18px] font-medium text-[#DA291C] mt-2">रू {(expenseSummary?.summary?.total_amount ?? 0).toLocaleString()}</p>
    </div>
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
      <p className="text-[10px] text-[#888888] uppercase tracking-[1px]">Outstanding Payables</p>
      <p className="text-[18px] font-medium text-amber-400 mt-2">रू {(payableSummary?.summary?.total_outstanding ?? 0).toLocaleString()}</p>
    </div>
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
      <p className="text-[10px] text-[#888888] uppercase tracking-[1px]">Net Profit</p>
      <p className="text-[18px] font-medium text-emerald-400 mt-2">
        रू {((stats?.profit?.gross_profit ?? 0) - (expenseSummary?.summary?.total_amount ?? 0)).toLocaleString()}
      </p>
    </div>
  </div>
  <div className="flex justify-center">
    <a href="/reports/finance" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A9B8E] text-white rounded-[2px] text-[13px] hover:bg-[#15897d] transition-colors">
      View Full Finance
      <ArrowRight className="h-4 w-4" />
    </a>
  </div>
</TabsContent>
```

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Reports.tsx
git commit -m "feat: simplify Reports Finance tab to summary with link to full Finance page"
```

---

### Task 8: Delete old files

**Files:**
- Delete: `frontend/src/pages/Expenses.tsx`
- Delete: `frontend/src/pages/SupplierPayables.tsx`
- Delete: `frontend/src/pages/CashFlow.tsx`
- Delete: `frontend/src/pages/BalanceSheet.tsx`
- Delete: `frontend/src/components/FinanceSidebarItem.tsx`

- [ ] **Step 1: Verify no other files import the deleted files**

Run: `cd frontend && grep -r "from.*pages/Expenses\|from.*pages/SupplierPayables\|from.*pages/CashFlow\|from.*pages/BalanceSheet\|from.*FinanceSidebarItem" src/ --include="*.tsx" --include="*.ts"`
Expected: Only Finance.tsx should show up (it no longer imports them since we migrated the code inline). If any other files import them, those need to be updated first.

- [ ] **Step 2: Delete the files**

```bash
rm frontend/src/pages/Expenses.tsx
rm frontend/src/pages/SupplierPayables.tsx
rm frontend/src/pages/CashFlow.tsx
rm frontend/src/pages/BalanceSheet.tsx
rm frontend/src/components/FinanceSidebarItem.tsx
```

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add -A frontend/src/
git commit -m "feat: delete old standalone finance pages and FinanceSidebarItem"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run the dev server and verify**

Run: `cd frontend && npm run dev`
Open browser and verify:
- Reports page loads with 4 tabs
- Reports Finance tab shows summary with "View Full Finance" link
- Clicking "View Full Finance" navigates to `/reports/finance`
- Finance page loads with 4 tabs (Expenses, Payables, Cash Flow, Balance Sheet)
- Each tab displays its content correctly
- Sidebar no longer has a Finance section
- Debtors page still works independently
- No console errors

- [ ] **Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: No errors

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "feat: finance consolidation complete"
```
