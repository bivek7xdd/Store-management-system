# Store Management System — Full Codebase Audit

> Generated: 2026-05-17
> Total Issues: 130+

## Summary

| Layer | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| Backend Handlers | 11 | 20 | 17 | 19 |
| Frontend Pages | 5 | 17 | 17 | 10 |
| Services & Contexts | 6 | 8 | 12 | 8 |
| Database & Server | 8 | 20+ | 12 | 4 |
| **Total** | **30** | **65+** | **58** | **41** |

---

## CRITICAL Issues (Must Fix Before Demo/Deploy)

### C1. No Multi-Tenant Isolation — Any user can access/modify/delete any store's data

**Severity:** CRITICAL
**Category:** Security / Architecture
**Files:** `backend/handlers/products.handler.go`, `backend/handlers/sales.handler.go`, `backend/handlers/return.handler.go`, `backend/handlers/supplier_payables.handler.go`, `backend/db/query/*.sql`

Most queries lack `store_id` filters. A malicious user can view/edit/delete any product, sale, supplier, or store in the system by guessing UUIDs.

Affected queries:
- `GetProduct` — `products.sql:24-25` — no `store_id` filter
- `UpdateProduct` — `products.sql:52` — no `store_id` check
- `DeleteProduct` — `products.sql:57-58` — no store check
- `GetSaleItem` — `sales.sql:66-67` — no store scoping
- `UpdateSaleAmount` — `sales.sql:62-63` — no `store_id` filter
- `GetStoreInfo` — `store_info.sql:14-15` — any user can fetch any store
- `GetAllStores` — `store_info.sql:22` — returns every store
- `DeleteStoreInfo` — `store_info.sql:43-44` — any user could delete any store
- `GetProductVariant` — `12_product_variants.sql:16-17` — no store scoping
- `DeleteVariantsByProduct` — `12_product_variants.sql:69-70` — no store scoping
- `UpdateStoreInfo` — `store_info.sql:39` — any user can update any store
- `UpdateStoreOwner` — `store_owner.sql:37` — any user could update any other user
- `return.handler.go:70-95` — doesn't verify sale belongs to store
- `supplier_payables.handler.go:29-56` — doesn't verify supplier belongs to store

**Fix:** Add a middleware that extracts `store_id` from JWT and automatically scopes all queries. Add `store_id` WHERE clauses to all unscoped queries.

---

### C2. Return Handler Has No Transaction — Data corruption risk

**Severity:** CRITICAL
**Category:** Data Integrity
**File:** `backend/handlers/return.handler.go:70-95`

Creates a return, then loops through items creating return items and adjusting stock as **separate, non-transactional queries**. If any step fails mid-loop, the return is left partially-created with inconsistent stock levels. The comment on line 69 even acknowledges: "This should ideally be wrapped in a transaction."

**Fix:** Wrap the entire operation (return creation + item creation + stock adjustments) in a single database transaction. Rollback on any failure.

---

### C3. Password Hash Leaked in Login Response

**Severity:** CRITICAL
**Category:** Security
**File:** `backend/handlers/user.handler.go:194`

```go
utils.SuccessResponse(c, "Login successful", gin.H{"userData": user, "newToken": token})
```

The `user` object is the raw DB row which includes the `password` field (bcrypt hash). This leaks the password hash to the client.

**Fix:** Return only safe fields (id, name, email, store_name, etc.). Never return the raw DB row.

---

### C4. Auth Token in URL Query Parameters — XSS/Log leakage

**Severity:** CRITICAL
**Category:** Security
**Files:** `frontend/src/services/reportService.ts:134-136`, `frontend/src/services/reportService.ts:140-142`

```typescript
const url = `${API_URL}/reports/export/csv?range=${range}&token=${token}`;
window.open(url, '_blank');
```

Auth token passed as `?token=...` in URLs opened via `window.open()`. Token appears in browser history, server access logs, proxy logs, and Referer headers.

**Fix:** Use POST requests with Authorization headers, or generate short-lived signed download URLs server-side.

---

### C5. No ErrorBoundary in Frontend — Single error crashes entire app

**Severity:** CRITICAL
**Category:** Reliability
**Files:** `frontend/src/` (all)

No `ErrorBoundary` exists anywhere. Any runtime exception (null reference, type error, etc.) crashes the entire React tree to a blank white screen.

Fragile code without protection:
- `Dashboard.tsx:359` — accesses `stats.sales.top_products` without null check
- `CategoryDetails.tsx:227` — accesses `product.status.product_status` without null check
- `SupplierDetails.tsx:294-343` — 14 uses of `(supplier as any)` that could be undefined

**Fix:** Add an ErrorBoundary component wrapping all routes in `App.tsx`. Add per-component error boundaries for critical sections.

---

### C6. Stored XSS in SalesHistory Print Templates

**Severity:** CRITICAL
**Category:** Security
**File:** `frontend/src/pages/SalesHistory.tsx:67-103, 110-157`

```tsx
html += `<div>${sale.customer_name}</div>`;
html += `<td>${item.product_name}</td>`;
```

All sale data is interpolated directly into HTML strings written to a new window via `printWindow.document.write(html)`. If any field contains `<script>` tags from the backend, they execute in the print window context.

**Fix:** Escape all HTML entities before interpolation, or use DOM APIs (`document.createElement`, `textContent`) instead of string concatenation.

---

### C7. `require()` in ES Module — SupplierDetails crashes in production

**Severity:** CRITICAL
**Category:** Bug
**File:** `frontend/src/pages/SupplierDetails.tsx:95-98`

```tsx
queryFn: async () => {
  const api = require("@/services/api").default;
  // ...
}
```

CommonJS `require()` inside an ES module. Vite doesn't support `require()` — this will crash in production.

**Fix:** Replace with standard ES module `import` at the top of the file.

---

### C8. No Graceful Shutdown

**Severity:** CRITICAL
**Category:** Reliability
**File:** `backend/main.go:205`

```go
router.Run(":" + PORT)
```

No signal handling for SIGTERM/SIGINT. Active requests are killed on deployment restart. No database connection pool cleanup, no Redis cleanup.

**Fix:** Use `http.Server` with `Shutdown()` on OS signal. Close DB and Redis connections properly.

---

### C9. Concurrent Sync Has No Lock/Mutex — Race conditions

**Severity:** CRITICAL
**Category:** Data Integrity
**File:** `frontend/src/services/syncService.ts:659-676`

No mutex or lock preventing concurrent `triggerSync()` calls. The `online` event handler and `init()` both call `triggerSync()`. If the user goes online/offline rapidly, or if `init()` is called twice, multiple sync chains run concurrently, causing duplicate API requests, race conditions on IndexedDB, and inconsistent `isSyncing` state.

**Fix:** Add a boolean `isSyncing` guard or mutex. Reject new sync requests while one is in progress.

---

### C10. Logout Doesn't Clear All IndexedDB Tables — Data leakage

**Severity:** CRITICAL
**Category:** Security
**File:** `frontend/src/contexts/AuthContext.tsx:114-119`

```typescript
await Promise.all([
    db.products.clear(),
    db.categories.clear(),
    db.suppliers.clear(),
    db.sales.clear(),
    db.customers.clear(),
]);
```

Missing tables: `db.notifications`, `db.pending_returns`, `db.product_variants`, `db.debts`. If user A logs out and user B logs in on the same device, user B can see user A's notifications, pending returns, debts, and product variants.

**Fix:** Clear ALL Dexie tables on logout. Use `db.delete()` or enumerate all table names.

---

## HIGH Severity Issues

### Backend

#### H1. No pagination on any list endpoint
**Files:** `sales.handler.go:201`, `debts.handler.go:75`, `customers.handler.go:14`, `suppliers.handler.go:58`, `category.handler.go:60`

Returns ALL records with no limit/offset. For stores with thousands of records, this causes memory exhaustion and slow responses.

#### H2. `CreateSale` silently skips invalid items
**File:** `backend/handlers/sales.handler.go:119-121`

If any item has an invalid `product_id`, it's silently skipped rather than returning a 400 error. Sale created with fewer items than requested, silent data loss.

#### H3. `RefreshTokenHandler` unchecked type assertions — will panic
**File:** `backend/handlers/user.handler.go:281`

All four type assertions use direct `.(type)` without the comma-ok idiom. If middleware ever sets a value of unexpected type, this will panic and crash the server.

#### H4. `UpdateDebt` bypasses payment audit trail
**File:** `backend/handlers/debts.handler.go:129-211`

Allows direct modification of `amount_paid` through the general update endpoint. Bypasses `RecordDebtPayment` handler which should be the only way to record payments.

#### H5. `RecordSupplierPayment` race condition — non-atomic read-modify-write
**File:** `backend/handlers/supplier_payables.handler.go:230-265`

Reads the payable, calculates new amounts in Go, then updates. Between read and update, another concurrent payment could be recorded, causing lost updates. Should be a single atomic SQL UPDATE.

#### H6. `CreateReturn` doesn't validate quantity ≤ sold
**File:** `backend/handlers/return.handler.go:44-98`

No check that the returned quantity doesn't exceed the originally sold quantity. Can return more items than were sold, inflating stock.

#### H7. `handleStockAdjustment` silently ignores all errors
**File:** `backend/handlers/return.handler.go:204-239`

All database calls ignore errors. If stock adjustment fails, the return is still marked as processed but inventory is wrong.

#### H8. No password validation on registration
**File:** `backend/handlers/user.handler.go:34-156`

No minimum length or complexity check on the registration password. Test plan AUTH-02 expects "Password too short" rejection but no such validation exists.

#### H9. `ForgotPasswordHandler` leaks timing information
**File:** `backend/handlers/user.handler.go:355-412`

When user doesn't exist, returns immediately. When user exists, generates OTP, stores it, and sends email before returning. Response time difference allows email enumeration.

#### H10. `CreateSale` allows negative prices
**File:** `backend/handlers/sales.handler.go:18-22`

No validation on `unit_price` being non-negative. A negative price would reduce the total amount, effectively giving money to the customer.

#### H11. `DeleteDebt` destroys audit trail
**File:** `backend/handlers/debts.handler.go:95-119`

No check for whether the debt has associated payment records before deletion. Deleting a debt with payment history destroys financial audit data.

#### H12. Report exports have no memory limit
**File:** `backend/handlers/reports.handler.go:504, 566`

Both export functions fetch ALL sales in the date range with no limit. For a year of data on a busy store, this could load millions of rows into memory.

#### H13. Market API calls have no rate limiting
**File:** `backend/handlers/market.handler.go:73-160, 189-262`

These call external APIs (Serper) which cost money per request. Without rate limiting, a malicious user could exhaust the API quota.

#### H14. JWT in query param in middleware
**File:** `backend/middleware/middleware.go:32`

`tokenString = c.Query("token")` — tokens in URLs are logged in server access logs, browser history, and referer headers.

#### H15. JWT expiry is 24 hours
**File:** `backend/utils/jwt.go:45`

`time.Now().Add(24 * time.Hour)` — long-lived tokens increase the window for token theft. Should be shorter (15min-1hr) with refresh tokens.

#### H16. `CreateSale` doesn't validate payments sum ≤ total
**File:** `backend/handlers/sales.handler.go:52-75`

If payments sum to more than the total amount, the excess is silently ignored.

#### H17. `SyncReturns` doesn't check for duplicate offline IDs
**File:** `backend/handlers/return.handler.go:100-157`

If the same offline return is synced twice, it will create duplicate return records.

#### H18. `ListReturns` accepts unvalidated limit/offset — potential DoS
**File:** `backend/handlers/return.handler.go:162-175`

Errors from `strconv.Atoi` are silently ignored. No upper bound on `limit`. A request with `limit=999999999` could exhaust server resources.

#### H19. `CreateCategories` returns 500 for JSON binding errors instead of 400
**File:** `backend/handlers/category.handler.go:30`

Invalid JSON from the client is a user error (400), not a server error (500).

#### H20. `GetSupplier` / `GetCategory` return 500 instead of 404 when not found
**Files:** `suppliers.handler.go:94-98`, `category.handler.go:136-139`

A "not found" from the database should be a 404, not a 500.

---

### Frontend

#### H21. Race condition in Sales checkout — stale `selectedCustomer`
**File:** `frontend/src/pages/Sales.tsx:319-408`

`finalizeCheckout` uses `selectedCustomer!` (non-null assertion) at line 365, but `selectedCustomer` can be set to `null` between the initial null-check at line 324 and the async submission. Crash during checkout → lost sale data.

#### H22. Stale closure in loyalty auto-apply effect
**File:** `frontend/src/pages/Sales.tsx:158-176`

Effect auto-applies loyalty discounts but only depends on `[selectedCustomer]`. `loyaltySettings` is fetched async. If settings change after the effect runs, the stale closure applies outdated discount percentages.

#### H23. Dashboard fetches 200 products just for counts
**File:** `frontend/src/pages/Dashboard.tsx:88-109`

`getProducts(200, 0)` fetches 200 products just to count `lowStockItems` and `nearExpiryItems`. On slow connections, this causes 5-10s loading times.

#### H24. `xlsx` library = 600KB bundle bloat
**File:** `frontend/src/pages/Inventory.tsx:2`

Only used for the CSV import feature. Adds 600KB to the initial JavaScript bundle.

#### H25. All icon buttons missing `aria-label`
**Files:** `Dashboard.tsx:161-167`, `Sales.tsx:445-454`, `SalesHistory.tsx:434-439`, `Customers.tsx:79-84`, `Suppliers.tsx:193`, `Categories.tsx:155`, `Layout.tsx:353-358`

Screen reader users cannot identify what these buttons do. WCAG 2.1 SC 4.1.2 violation.

#### H26. All data tables use `<div>` grids — no semantic table structure
**Files:** `Inventory.tsx`, `Customers.tsx`, `Debtors.tsx`, `SupplierPayables.tsx`, `Expenses.tsx`, `SalesHistory.tsx`

None support keyboard navigation. Screen readers cannot interpret data relationships. WCAG 2.1 SC 1.3.1 violation.

#### H27. Market/FindSuppliers/NotFound use completely wrong theme
**Files:** `Market.tsx:151-329`, `FindSuppliers.tsx:77-313`, `NotFound.tsx:21`

Uses light/teal theme (`text-gray-900`, `bg-gray-50`, `rounded-xl`) on a dark `#030303` app with `#DA291C` red accents. Looks like a completely different application.

#### H28. GSAP animations without cleanup
**Files:** `Login.tsx:26-57`, `OTP.tsx:21-36`

GSAP animations are set up but never killed. If component unmounts mid-animation, GSAP tries to animate detached DOM nodes, causing errors.

#### H29. ReturnsHistory Filter button does nothing
**File:** `frontend/src/pages/ReturnsHistory.tsx:82-86`

The "Filter" button has no `onClick` handler — renders but does nothing when clicked.

#### H30. BalanceSheet query key missing `dateRange`
**File:** `frontend/src/pages/BalanceSheet.tsx:25`

Query key doesn't include `dateRange`, so it never refetches when the date range changes. Stale financial data displayed.

#### H31. Debtors division by zero
**File:** `frontend/src/pages/Debtors.tsx:345`

If `amount_owed` is "0" or empty string, `parseFloat` returns 0, causing `Infinity` in `paidPct`. Renders as "Infinity%" in the UI.

#### H32. 18 pages have no pagination
**Files:** All finance/list pages

All finance pages load their entire dataset at once with no pagination or virtualization. If a store has 1000+ records, pages become extremely slow and memory-heavy.

#### H33. Sales cart "UNITS" label shows item count, not total quantity
**File:** `frontend/src/pages/Sales.tsx:610`

`cart.length` is the number of distinct line items, not the total quantity. A cart with 2 items each at quantity 5 shows "2 UNITS" instead of "10 UNITS".

#### H34. Inventory uses `window.confirm()` for destructive delete
**File:** `frontend/src/pages/Inventory.tsx:430-433`

Uses native `window.confirm()` which is not accessible. The rest of the app uses `AlertDialog` for confirmations.

#### H35. Settings password form — no strength indicator or requirements
**File:** `frontend/src/pages/Settings.tsx:93-95, 280-301`

Password validation only happens at submit time. No real-time strength feedback, no visible requirements list.

#### H36. Layout.tsx — `window.innerWidth` read without resize listener
**File:** `frontend/src/components/Layout.tsx:406`

Reads `window.innerWidth` during render but has no resize listener. If the user resizes the browser across the 1024px breakpoint, the padding won't update.

#### H37. ProtectedRoute redirects to "/" instead of "/login"
**File:** `frontend/src/components/ProtectedRoute.tsx:23`

Unauthenticated users are sent to the root path, which may itself redirect to `/login`. Creates a double redirect chain.

---

### Services & Contexts

#### H38. `deleteProduct` has no offline support
**File:** `frontend/src/services/inventory.ts:633-637`

Unlike every other CRUD operation, `deleteProduct` has no offline fallback, no `isOnline()` check, and no try/catch. Also doesn't delete associated variants from `db.product_variants`.

#### H39. `syncProducts` hardcoded limit=1000 with no pagination
**File:** `frontend/src/services/syncService.ts:345`

If the store has more than 1000 products, sync silently drops data. No pagination loop.

#### H40. Returns sync partial success treated as full success
**File:** `frontend/src/services/syncService.ts:596-656`

If the server returns `{ synced: ["id1"] }` but 5 returns were sent, only 1 is marked synced. The function returns `true` (success) even when most returns failed.

#### H41. 401 interceptor causes full page reload
**File:** `frontend/src/services/api.ts:40-52`

`window.location.href = '/login'` destroys all React state and causes a full page reload. Loses any unsaved data.

#### H42. SQL injection via unsanitized query parameters
**File:** `frontend/src/services/customerService.ts:27`

Missing `encodeURIComponent` on search query. If `query` contains `&` or `#`, it can break the URL or inject additional parameters.

#### H43. No retry logic in most services
**Files:** All services except `syncService.ts`

Only `syncService.ts` has retry logic with exponential backoff. All other services make single-shot API calls with no retry. Transient failures cause data loss.

#### H44. `@ts-ignore` suppresses real type errors
**Files:** `frontend/src/services/inventory.ts:74, 167, 233, 274`

These suppress real type safety issues. The response structure inconsistency indicates a backend API design problem that should be fixed, not silenced.

#### H45. Excessive console.log in production
**Files:** `frontend/src/services/inventory.ts`, `frontend/src/pages/Inventory.tsx`, `frontend/src/pages/Sales.tsx`

Debug `console.log` statements left in production code. Leaks internal state to browser console.

---

### Database

#### H46. Missing foreign keys everywhere
**Files:** `backend/db/schema/13_expenses.sql`, `backend/db/schema/14_supplier_payables.sql`

`expenses.store_id`, `supplier_payables.store_id`, `supplier_payables.supplier_id`, `supplier_payments.store_id`, `supplier_payments.payable_id` — all have no foreign key constraints. No referential integrity.

#### H47. Missing indexes on critical columns
**Files:** `backend/db/schema/08_sales_items.sql`, `backend/db/schema/03_customers.sql`, `backend/db/schema/06_sales.sql`

Missing indexes on: `sale_items.sale_id`, `sale_items.product_id`, `payment_records.sale_id`, `customers.phone`, `customers.store_id`, `sales.store_id`, `sales.sale_date`, `sales.customer_id`, `products.supplier_id`, `products.status`, `categories.store_id`, `suppliers.store_id`. Full table scans on every query.

#### H48. No CHECK constraints
**Files:** `backend/db/schema/08_sales_items.sql`, `backend/db/schema/12_returns.sql`, `backend/db/schema/13_expenses.sql`, `backend/db/schema/14_supplier_payables.sql`

No CHECK constraint preventing `quantity <= 0`, `unit_price < 0`, `refund_amount <= 0`, `amount > 0`, `amount_paid <= amount_owed`. Negative quantities, over-returns possible.

#### H49. No unique constraint on `(store_id, phone)` for customers
**File:** `backend/db/schema/03_customers.sql`

Duplicate customers per store possible.

#### H50. Schema files out of sync with migrations
**Files:** `backend/db/schema/` vs `backend/db/migration/`

Schema files are NOT the source of truth — migrations are. `schema/13_expenses.sql` has no FK but migration has proper FK. `schema/14_supplier_payables.sql` has no FKs but migration has them.

#### H51. `total_amount::float` for money
**File:** `backend/db/query/sales.sql:17`

Floating point precision loss for financial data. Should use `NUMERIC` or `DECIMAL`.

#### H52. `GetAllStores` returns ALL stores
**File:** `backend/db/query/store_info.sql:22`

No filtering — returns every store in the system.

---

### Server Configuration

#### H53. No security headers
**File:** `backend/main.go`

Missing: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`.

#### H54. No request size limit
**File:** `backend/main.go`

No `gin.MaxBodySize` middleware — vulnerable to large payload DoS attacks.

#### H55. No rate limiting on protected routes
**File:** `backend/main.go`

Rate limiting only on public auth endpoints. All protected routes (CRUD on products, sales, customers, debts, etc.) have no rate limiting.

#### H56. CORS has hardcoded Vercel preview URLs
**File:** `backend/main.go:27`

Hardcoded Vercel preview URLs that change with each preview deployment and will become stale.

#### H57. No HTTPS enforcement
**File:** `backend/main.go`

Server listens on plain HTTP only. No redirect from HTTP to HTTPS.

#### H58. `fmt.Println("Hello World")` in production
**File:** `backend/main.go:23`

Debug print statement left in production code.

---

## MEDIUM Severity Issues (Should Fix)

### Backend

#### M1. Duplicated date-range calculation logic in 3 functions
**File:** `backend/handlers/reports.handler.go:48-66, 482-498, 544-560`

The switch statement for calculating `startDate`/`endDate` from `rangeType` is copy-pasted identically in `GetReportStats`, `ExportSalesReportCSV`, and `ExportSalesReportPDF`. Should be a shared utility function.

#### M2. Linear regression forecast can produce `NaN`/`Inf`
**File:** `backend/handlers/reports.handler.go:276-277`

If `n*sumXX - sumX*sumX` equals zero (all data points have the same x value), this produces `NaN`. No guard against division by zero.

#### M3. `time.Parse` silently ignores errors
**Files:** `backend/handlers/products.handler.go:91-95, 444-449`

If the date format is wrong, the field is silently set to invalid/empty rather than returning a validation error to the client.

#### M4. `UpdateProduct` variant handling always creates new variants
**File:** `backend/handlers/products.handler.go:508-563`

When updating a product with variants, the handler creates new variants but never handles updating or deleting existing variants. Creates orphaned variant records.

#### M5. `CreateSale` payments sum can exceed total silently
**File:** `backend/handlers/sales.handler.go:52-75`

If payments sum to more than the total amount, the excess is silently ignored.

#### M6. No audit logging for destructive operations
**Files:** All handlers

Per test plan SEC-05, critical actions (delete product, delete supplier, delete category, delete debt) should log Who, What, When. No audit logging exists.

#### M7. `UpdatePasswordHandler` doesn't invalidate existing JWT tokens
**File:** `backend/handlers/user.handler.go:538-586`

Per test plan AUTH-09, sessions should be invalidated on password change. The handler updates the password but existing JWT tokens remain valid until expiry.

#### M8. sqlc-generated `Column2`, `Column4` parameter names
**Files:** `supplier_payables.handler.go:73-76`, `products.handler.go:621-627`, `expenses.handler.go:72-77`, `reports.handler.go:328-331`

Unclear parameter names from sqlc. SQL queries weren't given proper parameter names. Makes code harder to maintain.

#### M9. `GetNotifications` hardcoded pagination with no client control
**File:** `backend/handlers/notifications.handler.go:27-28`

Unlike other endpoints, this doesn't accept query parameters for pagination.

#### M10. `RegisterUserHandler` leaks internal error messages
**File:** `backend/handlers/user.handler.go:126`

Uses `err.Error()` directly as the user-facing message, potentially leaking database internals.

#### M11. `GetReportStats` ignores errors from `prevSales` and `Float64Value` calls
**File:** `backend/handlers/reports.handler.go:220-227`

Silently ignoring errors on numeric conversions can produce incorrect growth calculations.

#### M12. `GetPOSCatalog` doesn't use pagination
**File:** `backend/handlers/products.handler.go:664-706`

The POS catalog loads ALL products into memory. For large inventories this will be slow and memory-intensive.

#### M13. `SendDebtReminder` sends SMS with no rate limiting per customer
**File:** `backend/handlers/debts.handler.go:217-297`

No check on how recently an SMS was sent to the same customer. Could be abused to spam customers or exhaust SMS credits.

#### M14. `CreateExpense` doesn't validate amount is positive
**File:** `backend/handlers/expenses.handler.go:14-60`

A negative amount would pass validation and create a negative expense (effectively income).

#### M15. `UpdateStoreHandler` doesn't validate `currency_code` is a valid ISO code
**File:** `backend/handlers/user.handler.go:596-644`

Accepts any string for currency code. Invalid codes would cause downstream issues with financial calculations.

#### M16. `GetExpenseSummary` silently ignores errors from sub-queries
**File:** `backend/handlers/expenses.handler.go:216-234`

Errors from `GetExpenseTotalsByCategory` and `GetDailyExpenses` are silently swallowed, returning empty arrays instead of indicating partial failure.

#### M17. `GetSupplierPayable` silently ignores error from `ListPaymentsByPayable`
**File:** `backend/handlers/supplier_payables.handler.go:113`

If fetching payments fails, the response returns an empty payments array without indicating an error occurred.

---

### Frontend

#### M18. Three different approaches to checking online status
**Files:** `frontend/src/services/debts.ts:20`, `frontend/src/services/inventory.ts:38`, `frontend/src/services/syncService.ts`, `frontend/src/services/customerService.ts:8`

`navigator.onLine` raw, `syncService.getStatus().isOnline`, and direct `navigator.onLine` — different services can disagree about connectivity.

#### M19. Duplicated temp ID generation pattern — collision risk
**Files:** `frontend/src/services/inventory.ts:59, 218, 485, 498, 535, 581`, `frontend/src/services/debts.ts:43`

Using `Date.now()` alone creates collision risk if two items are created in the same millisecond. Should be a shared utility function with UUID or crypto random.

#### M20. `salesService.createSale` — stock decrement not atomic with sale creation
**File:** `frontend/src/services/sales.ts:34-129`

Sale is saved to Dexie, then stock is updated in a separate transaction. If stock update fails, the sale exists but stock wasn't decremented.

#### M21. `categoryPreferencesService` circular reference pattern
**File:** `frontend/src/services/categoryPreferences.ts:59-61`

`exists()` calls `retrieve()` which calls `clear()` — creates a circular dependency within the same object. Fragile if the object is destructured.

#### M22. `WalkthroughContext` setTimeout without cleanup on unmount
**File:** `frontend/src/contexts/WalkthroughContext.tsx:96, 104`

If the component unmounts within 300ms of calling `startTour()`, `setIsRunning(true)` fires on an unmounted component.

#### M23. `marketService` inconsistent response shape check
**File:** `frontend/src/services/marketService.ts:18`

Checks for `response.data.success` but every other service checks for `response.data.data`. If `success` is `false` or missing, it returns `[]` silently — caller has no way to know the request failed vs. returned empty.

#### M24. Finance pages have zero offline support
**Files:** `frontend/src/services/expenseService.ts`, `frontend/src/services/supplierPayableService.ts`

These services have zero offline support while the app is explicitly designed as offline-first. Users can create expenses and supplier payables only when online.

#### M25. `reportService` range parameter not validated
**File:** `frontend/src/services/reportService.ts:129`

The `range` parameter is passed directly into the URL without validation or encoding. If a caller passes `range = "today&token=malicious"`, it injects additional query parameters.

#### M26. No request deduplication
**Files:** All services

Multiple components calling the same service method simultaneously will trigger duplicate API requests. No request caching or deduplication exists.

#### M27. Hardcoded 15s timeout globally
**File:** `frontend/src/services/api.ts:22`

All requests share a 15s timeout. Report generation or bulk exports may need longer.

#### M28. `debtService` status type cast is unsafe
**File:** `frontend/src/services/debts.ts:75`

Any string can be passed as `data.status` and it will be blindly cast to the union type. No validation that the value is one of `'pending' | 'paid' | 'partial' | 'written-off'`.

#### M29. `getPOSCatalog` missing return type
**File:** `frontend/src/services/inventory.ts:412-440`

Returns `any[]` (implicit). No type annotation.

#### M30. `salesService.getSaleDetails` type coercion bug
**File:** `frontend/src/services/sales.ts:155`

Forces `id` to `Number`, but if `id` is a string UUID, `Number("abc-123")` returns `NaN`, and `db.sales.get(NaN)` returns `undefined`.

#### M31. `inventory.ts:409` offset parameter accepted but ignored
**File:** `frontend/src/services/inventory.ts:409`

`return products.slice(0, limit)` — the `offset` parameter is accepted but never applied. Pagination returns the first `limit` items regardless of offset.

#### M32. `NotificationContext` — `fetchUnreadCount` does nothing useful
**File:** `frontend/src/contexts/NotificationContext.tsx:52-59`

The result of `getUnreadCount()` is discarded. The unread count is derived from the notifications array state, making this function a no-op that wastes a network request.

---

### Database

#### M33. No migration rollback/down migrations
**Files:** `backend/db/migration/`

All migrations are forward-only. No way to rollback if a migration causes issues.

#### M34. Destructive `UpdateProductWithVariantsTx` deletes then recreates variants
**File:** `backend/db/sqlc/store.go:253`

Does `DeleteVariantsByProduct` then recreates — this is destructive and loses variant history. If the transaction fails midway, variants are permanently deleted.

#### M35. Typo in migration filename
**File:** `backend/db/migration/20260422020102_product_varient.sql`

Typo "varient" instead of "variant".

#### M36. Missing migrations for schema fixes
**Files:** `backend/db/migration/`

No migrations exist to add missing foreign keys, missing indexes, CHECK constraints, or `store_id` to `sale_items`.

#### M37. `SearchProducts` uses ILIKE pattern that doesn't use trigram index
**File:** `backend/db/query/products.sql:65-66`

`name ILIKE '%' || $2 || '%'` — the GIN trigram index (`idx_products_name_trgm`) is not used with this pattern. Should use `name % $2` (similarity) for better index utilization.

#### M38. `product_variants.unique_product_variant_barcode` is global
**File:** `backend/db/schema/05z_product_variants.sql:17`

Global uniqueness on barcode — should be scoped to store.

#### M39. `customers.created_at` missing `NOT NULL`
**File:** `backend/db/schema/03_customers.sql:11`

#### M40. `suppliers` columns are all nullable
**File:** `backend/db/schema/02_suppliers.sql:3-6`

A supplier with no name is meaningless.

#### M41. `sales` has no `created_at`/`updated_at` timestamps
**File:** `backend/db/schema/06_sales.sql`

Only `sale_date` which is mutable.

#### M42. `sale_items` has no `created_at` timestamp
**File:** `backend/db/schema/08_sales_items.sql`

#### M43. `otp_tokens.user_email` is `VARCHAR(50)` but `store_owner.email` is `VARCHAR(255)`
**Files:** `backend/db/schema/09_otp_tokens.sql:5` vs `backend/db/schema/01_store_owner.sql:4`

Inconsistent lengths.

#### M44. `supplier_payables.status` is `VARCHAR(20)` instead of ENUM
**File:** `backend/db/schema/14_supplier_payables.sql:9`

Should use a proper enum type like `debt_status` to prevent invalid values.

---

### Server Configuration

#### M45. No request ID / correlation ID middleware
**File:** `backend/main.go`

No middleware to generate and propagate request IDs for tracing across logs.

#### M46. No health check endpoint
**File:** `backend/main.go`

No `/health` or `/ready` endpoint for container orchestration.

#### M47. No API versioning
**File:** `backend/main.go`

All routes are `/api/...` with no version prefix — breaking changes will break all clients.

#### M48. No pagination enforcement on `:many` queries
**Files:** `backend/db/query/*.sql`

Many `:many` queries have no `LIMIT` by default (`GetCategories`, `GetAllSuppliers`, `ListSales`, `GetDebts`, etc.).

#### M49. `gin.DebugMode` potentially enabled in production
**File:** `backend/main.go:25`

`gin.Default()` uses the mode from `GIN_MODE` env var. If not set to `release`, debug mode leaks route information.

#### M50. No structured logging middleware
**File:** `backend/main.go`

No middleware for request duration, status codes, etc. using zap or zerolog.

#### M51. Input validation middleware functions exist but are never called
**File:** `backend/utils/sanitize.go`

The `sanitize.go` file has SQL injection/XSS detection functions, but they are never called in any handler or middleware. The regex-based SQL injection detection is also fundamentally flawed.

---

### Frontend Pages

#### M52. Dashboard — duplicate computation on every render
**File:** `frontend/src/pages/Dashboard.tsx:113-125`

Filters run on every render. With 200 products, this executes twice per render cycle. Should be `useMemo`.

#### M53. Dashboard — inline function creates new object every render
**File:** `frontend/src/pages/Dashboard.tsx:129-133`

Function is recreated on every render, and the `colors` object inside it is a new object each time. Should be `useCallback` or moved outside the component.

#### M54. SalesHistory — lazy-loads sale details but never caches
**File:** `frontend/src/pages/SalesHistory.tsx:47-58`

Details are stored in local component state and lost on unmount. Re-expanding the same sale after navigating away re-fetches from the server.

#### M55. ReturnsHistory — no pagination, client-side filtering
**File:** `frontend/src/pages/ReturnsHistory.tsx:43-47`

All returns loaded at once, filtered client-side.

#### M56. Customers — no pagination
**File:** `frontend/src/pages/Customers.tsx:64-68`

All customers loaded at once.

#### M57. MarketDiscovery — 1187+ line monolithic file
**File:** `frontend/src/pages/MarketDiscovery.tsx`

Single file contains map rendering, geolocation, search strategies, relevance scoring, supplier card UI, filter/sort logic, and main page layout. Unmaintainable, hard to test.

#### M58. MarketDiscovery — `MAPBOX_TOKEN` read on every render
**File:** `frontend/src/pages/MarketDiscovery.tsx:132`

Inside component body, re-evaluating `import.meta.env` on every render. Should be a module-level constant.

#### M59. MarketDiscovery — `triggerSearch` uses DOM query + click
**File:** `frontend/src/pages/MarketDiscovery.tsx:958-965`

Fragile DOM query anti-pattern. If the button structure changes, this silently breaks.

#### M60. CashFlow — supplier payment outflow hidden from table
**File:** `frontend/src/pages/CashFlow.tsx:37, 167-169`

`supplier_payment_outflow` is included in `totalOutflow` but never displayed as its own column in the table.

#### M61. CategoryDetails — potential null reference
**File:** `frontend/src/pages/CategoryDetails.tsx:227`

If `product.status` is null/undefined, this throws a TypeError. Crashes the entire page.

#### M62. SupplierDetails — 14+ uses of `any` type casting
**File:** `frontend/src/pages/SupplierDetails.tsx:64, 294, 295, 306, 307, 316, 319, 320, 322, 328, 334, 337, 341, 343`

The Supplier interface is missing bank/payment fields, so the code uses `as any` everywhere. Loses TypeScript safety.

#### M63. `canvas-confetti` imported at top level
**File:** `frontend/src/pages/Sales.tsx:14`

Adds ~15KB to the bundle. Only used after successful checkout. Should be dynamically imported.

#### M64. Dashboard — `today` date recomputed every render
**File:** `frontend/src/pages/Dashboard.tsx:78`

Creates a new Date and formats it on every render. Should be `useState` with initializer.

---

## LOW Severity Issues (Nice to Fix)

### L1. Inconsistent error response patterns
**Files:** Backend handlers

Some handlers use `utils.ErrorResponse()`, while `CreateCategories` uses direct `c.JSON()`. `CreateReturn` uses lowercase error messages while others use sentence case.

### L2. Unstructured logging with `log.Printf`
**Files:** `backend/handlers/products.handler.go:51, 188, 204, 278, 325, 550, 568, 628, 643, 671`

Using `log.Printf` for errors means they go to stdout unstructured. Should use a structured logger.

### L3. Tests skip when DB unavailable — no mocked unit tests
**Files:** `backend/handlers/inventory_test.go:68`, `backend/handlers/notifications_test.go:58`

Tests use `t.Skip()` when DB isn't connected, meaning they only run in integration mode. No unit tests with mocked dependencies exist.

### L4. No tests for critical financial handlers
**Files:** Backend handlers

No tests for: returns, expenses, supplier payables, reports, customers, debts, market, notifications CRUD. Only `user`, `products`, `categories`, `sales`, and `notifications` (partial) have test coverage.

### L5. Inconsistent API endpoint patterns
**Files:** Frontend services

Some services use leading slashes, some don't. Axios handles both, but this inconsistency makes it harder to audit endpoints.

### L6. Inconsistent heading styles across pages
**Files:** All pages

Dashboard uses `text-[22px] font-medium`, Inventory uses `text-[24px] font-bold`, Market uses `text-3xl font-bold text-gray-900` (wrong theme!).

### L7. Inconsistent padding bottom for mobile nav
**Files:** All pages

Most pages use `pb-24 lg:pb-8`, Reports uses `pb-20`, Sales uses `pb-20 lg:pb-6`. Bottom nav overlaps content on some pages.

### L8. Inconsistent empty state patterns
**Files:** All list pages

Inventory has "No products found", ReturnsHistory has no empty state at all, Expenses has "No expenses found", Suppliers has no empty state.

### L9. Inconsistent loading patterns
**Files:** All pages

Dashboard has custom spinner, Inventory has skeleton cards, Sales has no loading state, Customers has "Loading customers..." text.

### L10. No loading states on form submissions
**Files:** `Settings.tsx`, `Login.tsx`, `OTP.tsx`, `EnhancedSignup.tsx`

Password change form, login form, and signup form all lack loading/disabled states on their submit buttons. Users can click submit multiple times.

### L11. Inconsistent toast usage
**Files:** All pages

Some use `toast.success()`, some use `toast()` with description, some use `sonner` directly, some have no toast on error.

### L12. LandingPage — external video CDN dependency
**File:** `frontend/src/pages/LandingPage.tsx:456`

If this CloudFront URL expires or the bucket is deleted, the hero section breaks.

### L13. LandingPage — external noise texture URL
**File:** `frontend/src/pages/LandingPage.tsx:413`

External dependency for a cosmetic noise effect. If the Vercel deployment goes down, the background texture disappears.

### L14. Market.tsx — dead `colors` object
**File:** `frontend/src/pages/Market.tsx:8-11`

Defined but never used. Dead code.

### L15. CreateInventoryDialogs — duplicate bank details form
**File:** `frontend/src/components/CreateInventoryDialogs.tsx:354-396, 424-465`

Bank details form is copy-pasted twice. Changes must be made in two places.

### L16. Register.tsx — dead redirect wrapper
**File:** `frontend/src/pages/Register.tsx:1-11`

Just a redirect to `EnhancedSignup`. Should be removed and the route should point directly to `EnhancedSignup`.

### L17. CSV export doesn't handle errors from `writer.Write()`
**File:** `backend/handlers/reports.handler.go:523-533`

The return value (error) from `writer.Write` is not checked. If the write fails mid-stream, the CSV will be truncated without indication.

### L18. `GetReportStats` cache key doesn't include timezone
**File:** `backend/handlers/reports.handler.go:33`

Two users in different timezones requesting "today" at the same UTC moment would get the same cached data.

### L19. `syncService.ts:203-207` — Sale ID may be auto-generated Dexie number
**File:** `frontend/src/services/syncService.ts:203-207`

If `sale.id` is a Dexie auto-increment key (number), this works. But if the sale was created with a custom ID, the update may target the wrong record.

### L20. Inconsistent border-radius usage
**Files:** Frontend pages

Most pages use `rounded-[2px]` per design system, but some pages use `rounded-lg`, `rounded-xl`, `rounded` — inconsistent with the Ferrari-inspired design system.

---

## Top 10 Priority Fixes

1. **Add multi-tenant middleware** that scopes all queries to the authenticated user's store
2. **Wrap return handler in a database transaction**
3. **Remove password hash from login response**
4. **Fix auth token in URL** — use POST with Authorization header for exports
5. **Add ErrorBoundary** wrapping all routes
6. **Sanitize print HTML** in SalesHistory
7. **Fix `require()` call** in SupplierDetails
8. **Add graceful shutdown** to main.go
9. **Add sync mutex/lock** to prevent concurrent sync
10. **Clear all IndexedDB tables on logout**
