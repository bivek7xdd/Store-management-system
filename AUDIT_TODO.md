# Audit TODO List

> Generated: 2026-05-17
> Source: AUDIT.md
> Total: 130 tasks

## Critical (10 items)

- [x] C1: Add multi-tenant middleware to scope all queries to authenticated user's store
- [x] C2: Wrap return handler in a database transaction (return.handler.go:70-95)
- [x] C3: Remove password hash from login response (user.handler.go:194)
- [x] C4: Fix auth token in URL — use POST with Authorization header for exports (reportService.ts:134-142)
- [x] C5: Add ErrorBoundary wrapping all routes in App.tsx
- [x] C6: Sanitize print HTML in SalesHistory to prevent stored XSS (SalesHistory.tsx:67-157)
- [x] C7: Fix require() call in SupplierDetails — replace with ES module import (SupplierDetails.tsx:95-98)
- [x] C8: Add graceful shutdown to main.go with SIGTERM/SIGINT handling
- [x] C9: Add sync mutex/lock to prevent concurrent sync (syncService.ts:659-676)
- [x] C10: Clear ALL IndexedDB tables on logout (AuthContext.tsx:114-119)

## High (58 items)

### Backend

- [ ] H1: Add pagination to all list endpoints (sales, debts, customers, suppliers, categories)
- [ ] H2: Fix CreateSale to return 400 on invalid product_id instead of silently skipping (sales.handler.go:119-121)
- [x] H3: Fix RefreshTokenHandler unchecked type assertions (user.handler.go:281)
- [ ] H4: Fix UpdateDebt to bypass direct amount_paid modification (debts.handler.go:129-211)
- [ ] H5: Fix RecordSupplierPayment race condition with atomic SQL UPDATE (supplier_payables.handler.go:230-265)
- [ ] H6: Add return quantity validation ≤ sold quantity (return.handler.go:44-98)
- [ ] H7: Fix handleStockAdjustment to propagate errors (return.handler.go:204-239)
- [x] H8: Add password validation on registration (user.handler.go:34-156)
- [x] H9: Fix ForgotPasswordHandler timing leak (user.handler.go:355-412)
- [x] H10: Add non-negative price validation to CreateSale (sales.handler.go:18-22)
- [ ] H11: Add payment record check before DeleteDebt (debts.handler.go:95-119)
- [ ] H12: Add memory limits to report exports (reports.handler.go:504, 566)
- [ ] H13: Add rate limiting to Market API calls (market.handler.go:73-160)
- [x] H14: Remove JWT from query param in middleware (middleware.go:32)
- [x] H15: Reduce JWT expiry to 1hr with refresh tokens (jwt.go:45)
- [ ] H16: Validate payments sum ≤ total in CreateSale (sales.handler.go:52-75)
- [ ] H17: Add duplicate offline ID check to SyncReturns (return.handler.go:100-157)
- [ ] H18: Validate limit/offset in ListReturns (return.handler.go:162-175)
- [ ] H19: Fix CreateCategories to return 400 for JSON binding errors (category.handler.go:30)
- [ ] H20: Fix GetSupplier/GetCategory to return 404 when not found

### Frontend

- [ ] H21: Fix race condition in Sales checkout — stale selectedCustomer (Sales.tsx:319-408)
- [ ] H22: Fix stale closure in loyalty auto-apply effect (Sales.tsx:158-176)
- [ ] H23: Optimize Dashboard to use dedicated low-stock endpoint instead of fetching 200 products (Dashboard.tsx:88-109)
- [ ] H24: Lazy-load xlsx library for CSV import (Inventory.tsx:2)
- [ ] H25: Add aria-label to all icon buttons across pages
- [ ] H26: Convert div-grid data tables to semantic <table> elements
- [ ] H27: Fix Market/FindSuppliers/NotFound to use dark theme (#030303 / #DA291C)
- [ ] H28: Add GSAP animation cleanup on component unmount (Login.tsx, OTP.tsx)
- [x] H29: Fix ReturnsHistory Filter button — add onClick handler (ReturnsHistory.tsx:82-86)
- [x] H30: Fix BalanceSheet query key to include dateRange (BalanceSheet.tsx:25)
- [x] H31: Fix Debtors division by zero (Debtors.tsx:345)
- [ ] H32: Add pagination to all finance/list pages
- [x] H33: Fix Sales cart UNITS label to show total quantity not item count (Sales.tsx:610)
- [x] H34: Replace window.confirm() with AlertDialog in Inventory delete (Inventory.tsx:430-433)
- [ ] H35: Add password strength indicator to Settings (Settings.tsx:280-301)
- [ ] H36: Add resize listener to Layout.tsx for window.innerWidth (Layout.tsx:406)
- [x] H37: Fix ProtectedRoute to redirect directly to /login (ProtectedRoute.tsx:23)

### Services & Contexts

- [ ] H38: Add offline support to deleteProduct (inventory.ts:633-637)
- [ ] H39: Add pagination loop to syncProducts (syncService.ts:345)
- [ ] H40: Fix returns sync partial success handling (syncService.ts:596-656)
- [x] H41: Fix 401 interceptor to preserve React state (api.ts:40-52)
- [x] H42: Add encodeURIComponent to customerService search query (customerService.ts:27)
- [ ] H43: Add retry logic to all services (expenseService, supplierPayableService, notifications, etc.)
- [ ] H44: Fix @ts-ignore suppressions in inventory.ts — fix backend API inconsistency
- [x] H45: Remove console.log statements from production code

### Database

- [ ] H46: Add missing foreign keys to expenses, supplier_payables, supplier_payments tables
- [ ] H47: Add missing indexes on critical columns (sale_items.sale_id, customers.phone, sales.store_id, etc.)
- [ ] H48: Add CHECK constraints to sale_items, returns, expenses, supplier_payables
- [ ] H49: Add unique constraint on (store_id, phone) for customers
- [ ] H50: Sync schema files with migrations
- [ ] H51: Fix total_amount::float to use NUMERIC/DECIMAL for money (sales.sql:17)
- [ ] H52: Add store_id filter to GetAllStores (store_info.sql:22)

### Server Configuration

- [x] H53: Add security headers middleware (HSTS, CSP, X-Frame-Options, etc.)
- [x] H54: Add request size limit middleware (gin.MaxBodySize)
- [x] H55: Add rate limiting to protected routes
- [x] H56: Fix CORS to use dynamic Vercel URLs instead of hardcoded
- [x] H57: Add HTTPS enforcement
- [x] H58: Remove fmt.Println("Hello World") from main.go:23

## Medium (64 items)

### Backend

- [ ] M1: Extract shared date-range calculation utility (reports.handler.go)
- [ ] M2: Add division by zero guard to linear regression forecast (reports.handler.go:276-277)
- [ ] M3: Fix time.Parse to return validation errors instead of silently ignoring (products.handler.go)
- [ ] M4: Fix UpdateProduct variant handling to update/delete existing variants (products.handler.go:508-563)
- [ ] M5: Validate payments sum ≤ total in CreateSale (sales.handler.go:52-75)
- [ ] M6: Add audit logging for destructive operations (SEC-05)
- [ ] M7: Invalidate existing JWT tokens on password change (AUTH-09)
- [ ] M8: Fix sqlc-generated Column2/Column4 parameter names with proper SQL parameter names
- [ ] M9: Add pagination query params to GetNotifications (notifications.handler.go:27-28)
- [ ] M10: Fix RegisterUserHandler to not leak internal error messages (user.handler.go:126)
- [ ] M11: Fix GetReportStats to handle errors from prevSales and Float64Value (reports.handler.go:220-227)
- [ ] M12: Add pagination to GetPOSCatalog (products.handler.go:664-706)
- [ ] M13: Add rate limiting to SendDebtReminder SMS (debts.handler.go:217-297)
- [ ] M14: Add positive amount validation to CreateExpense (expenses.handler.go:14-60)
- [ ] M15: Validate currency_code is valid ISO code (user.handler.go:596-644)
- [ ] M16: Fix GetExpenseSummary to propagate sub-query errors (expenses.handler.go:216-234)
- [ ] M17: Fix GetSupplierPayable to propagate ListPaymentsByPayable errors (supplier_payables.handler.go:113)

### Frontend

- [ ] M18: Unify online status checking across all services
- [ ] M19: Create shared temp ID generation utility with UUID/crypto random
- [ ] M20: Make salesService.createSale stock decrement atomic with sale creation
- [ ] M21: Fix categoryPreferencesService circular reference pattern
- [ ] M22: Add setTimeout cleanup to WalkthroughContext on unmount
- [ ] M23: Fix marketService inconsistent response shape check
- [ ] M24: Add offline support to expenseService and supplierPayableService
- [ ] M25: Validate and encode range parameter in reportService
- [ ] M26: Add request deduplication/caching to services
- [ ] M27: Make API timeout configurable per-request instead of hardcoded 15s
- [ ] M28: Validate debt status type cast (debts.ts:75)
- [ ] M29: Add return type to getPOSCatalog (inventory.ts:412-440)
- [ ] M30: Fix salesService.getSaleDetails type coercion bug with UUID→Number (sales.ts:155)
- [ ] M31: Fix inventory.ts offset parameter to actually apply slicing (inventory.ts:409)
- [ ] M32: Remove or fix dead fetchUnreadCount in NotificationContext
- [ ] M52: Memoize Dashboard lowStockItems and nearExpiryItems computations
- [ ] M53: Memoize Dashboard saleTypeColor function
- [ ] M54: Cache sale details in react-query instead of local state (SalesHistory.tsx)
- [ ] M55: Add pagination to ReturnsHistory
- [ ] M56: Add pagination to Customers page
- [ ] M57: Refactor MarketDiscovery monolithic file into smaller components
- [ ] M58: Move MAPBOX_TOKEN to module-level constant (MarketDiscovery.tsx:132)
- [ ] M59: Fix MarketDiscovery triggerSearch to use callable function instead of DOM query
- [ ] M60: Add supplier_payment_outflow column to CashFlow table
- [ ] M61: Add null check for product.status in CategoryDetails (CategoryDetails.tsx:227)
- [x] M62: Fix Supplier interface to include bank/payment fields instead of using as any
- [ ] M63: Dynamically import canvas-confetti in Sales.tsx
- [ ] M64: Memoize Dashboard today date with useState initializer

### Database

- [ ] M33: Add migration rollback/down migrations
- [ ] M34: Fix destructive UpdateProductWithVariantsTx to preserve variant history
- [ ] M35: Fix typo in migration filename (product_varient → product_variant)
- [ ] M36: Create migrations for missing FKs, indexes, CHECK constraints
- [ ] M37: Fix SearchProducts to use trigram index effectively (products.sql:65-66)
- [ ] M38: Scope product_variants barcode uniqueness to store
- [ ] M39: Add NOT NULL to customers.created_at
- [ ] M40: Add NOT NULL to suppliers.name and other critical columns
- [ ] M41: Add created_at/updated_at timestamps to sales table
- [ ] M42: Add created_at timestamp to sale_items table
- [ ] M43: Fix otp_tokens.user_email VARCHAR length to match store_owner.email
- [ ] M44: Change supplier_payables.status to ENUM type

### Server Configuration

- [ ] M45: Add request ID / correlation ID middleware
- [ ] M46: Add /health and /ready endpoints
- [ ] M47: Add API versioning prefix to routes
- [ ] M48: Add default LIMIT to all :many queries
- [ ] M49: Set GIN_MODE=release in production
- [ ] M50: Add structured logging middleware (zap/zerolog)
- [ ] M51: Wire up input validation middleware from sanitize.go or replace with proper validation

## Low (20 items)

- [ ] L1: Unify error response patterns across all backend handlers
- [ ] L2: Replace log.Printf with structured logger in backend handlers
- [ ] L3: Add mocked unit tests for backend handlers
- [ ] L4: Add tests for returns, expenses, supplier payables, reports, customers, debts, market handlers
- [ ] L5: Unify API endpoint patterns (leading slash consistency)
- [ ] L6: Unify heading styles across all pages per design system
- [ ] L7: Unify padding bottom for mobile nav across all pages
- [ ] L8: Add consistent empty state patterns to all list pages
- [ ] L9: Add consistent loading patterns to all pages
- [ ] L10: Add loading/disabled states to all form submit buttons
- [ ] L11: Unify toast usage patterns across all pages
- [ ] L12: Replace external CloudFront video URL with self-hosted or fallback (LandingPage.tsx:456)
- [ ] L13: Replace external noise texture URL with local asset (LandingPage.tsx:413)
- [ ] L14: Remove dead colors object from Market.tsx
- [ ] L15: Extract duplicate bank details form into shared component (CreateInventoryDialogs.tsx)
- [ ] L16: Remove dead Register.tsx redirect wrapper — route directly to EnhancedSignup
- [ ] L17: Handle writer.Write() errors in CSV export (reports.handler.go:523-533)
- [ ] L18: Include timezone in GetReportStats cache key (reports.handler.go:33)
- [ ] L19: Fix syncService sale ID handling for Dexie auto-increment vs custom IDs
- [ ] L20: Unify border-radius to rounded-[2px] per design system across all pages
