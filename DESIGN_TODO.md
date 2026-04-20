# 🎨 Design System Update — Pages TODO

Ferrari-inspired Chiaroscuro theme. Reference: `DESIGN.md`

---

## Auth Flow

- [x] `Login.tsx`
- [x] `Register.tsx` (via `EnhancedSignup.tsx` + step components)
- [x] `OTP.tsx`
- [x] `ForgotPassword.tsx`
- [x] `ResetPassword.tsx`

---

## Core App Pages

- [x] `Dashboard.tsx`
- [ ] `Inventory.tsx`
- [x] `Sales.tsx`
- [ ] `SalesHistory.tsx`
- [ ] `Reports.tsx`
- [x] `Debtors.tsx`
- [ ] `Settings.tsx`

---

## Category Pages

- [ ] `Categories.tsx`
- [ ] `CategoryDetails.tsx`

---

## Supplier Pages

- [ ] `Suppliers.tsx`
- [ ] `SupplierDetails.tsx`

---

## Market Pages

- [ ] `Market.tsx`
- [ ] `MarketDiscovery.tsx`

---

## Other

- [ ] `LandingPage.tsx`
- [ ] `NotFound.tsx`

---

> **Tip:** Inner app pages share a common layout — updating the sidebar/`Layout` component will cascade styling across Dashboard, Inventory, Sales, etc. at once.
