-- Drop trigger
DROP TRIGGER IF EXISTS trigger_debts_updated_at ON debts;

-- Drop indexes for debt_payments
DROP INDEX IF EXISTS idx_debt_payments_date;
DROP INDEX IF EXISTS idx_debt_payments_received_by;
DROP INDEX IF EXISTS idx_debt_payments_debt;

-- Drop indexes for debts
DROP INDEX IF EXISTS idx_debts_status;
DROP INDEX IF EXISTS idx_debts_store_due_date;
DROP INDEX IF EXISTS idx_debts_store_status;
DROP INDEX IF EXISTS idx_debts_sale;
DROP INDEX IF EXISTS idx_debts_customer;
DROP INDEX IF EXISTS idx_debts_store;

-- Drop tables
DROP TABLE IF EXISTS debt_payments;
DROP TABLE IF EXISTS debts;
