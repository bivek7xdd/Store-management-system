-- Create debts table
CREATE TABLE "debts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "sale_id" uuid REFERENCES "sales"("id") ON DELETE SET NULL,
  "amount_owed" decimal(10,2) NOT NULL CHECK (amount_owed >= 0),
  "amount_paid" decimal(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
  "amount_remaining" decimal(10,2) NOT NULL CHECK (amount_remaining >= 0),
  "due_date" date NOT NULL,
  "status" varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

-- Create debt_payments table
CREATE TABLE "debt_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "debt_id" uuid NOT NULL REFERENCES "debts"("id") ON DELETE CASCADE,
  "amount_paid" decimal(10,2) NOT NULL CHECK (amount_paid > 0),
  "payment_method" varchar(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'bank_transfer')),
  "payment_date" timestamptz DEFAULT (now()),
  "received_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "notes" text
);

-- Create indexes for debts
CREATE INDEX idx_debts_store ON debts(store_id);
CREATE INDEX idx_debts_customer ON debts(customer_id);
CREATE INDEX idx_debts_sale ON debts(sale_id);
CREATE INDEX idx_debts_store_status ON debts(store_id, status);
CREATE INDEX idx_debts_store_due_date ON debts(store_id, due_date);
CREATE INDEX idx_debts_status ON debts(status);

-- Create indexes for debt_payments
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX idx_debt_payments_received_by ON debt_payments(received_by);
CREATE INDEX idx_debt_payments_date ON debt_payments(payment_date);

-- Add trigger for updated_at
CREATE TRIGGER trigger_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
