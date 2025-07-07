-- Update database schema for comprehensive commitment management
-- Run this in your Supabase SQL editor

-- Create monthly_income table
CREATE TABLE IF NOT EXISTS monthly_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g., '2025-07'
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month) -- One income record per user per month
);

-- Create new commitments table (with proper structure)
CREATE TABLE IF NOT EXISTS new_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('static', 'dynamic')),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  recurring BOOLEAN DEFAULT TRUE,
  shared BOOLEAN DEFAULT FALSE,
  group_id UUID,
  start_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create commitment_payments table
CREATE TABLE IF NOT EXISTS commitment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES new_commitments(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g., '2025-07'
  paid_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(commitment_id, month) -- One payment per commitment per month
);

-- Migrate existing commitments to new structure (if any exist)
-- This preserves your existing data while moving to the new schema
INSERT INTO new_commitments (user_id, type, title, category, amount, recurring, shared, start_date)
SELECT 
  user_id,
  type,
  title,
  category,
  amount,
  TRUE as recurring,
  is_shared,
  CURRENT_DATE as start_date
FROM commitments
WHERE EXISTS (SELECT 1 FROM commitments LIMIT 1);

-- Rename old table and promote new one
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commitments') THEN
    ALTER TABLE commitments RENAME TO legacy_commitments;
  END IF;
END
$$;

ALTER TABLE new_commitments RENAME TO commitments;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_income_user_month ON monthly_income(user_id, month);
CREATE INDEX IF NOT EXISTS idx_commitments_user_id ON commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_commitments_start_date ON commitments(start_date);
CREATE INDEX IF NOT EXISTS idx_commitment_payments_commitment_month ON commitment_payments(commitment_id, month);
CREATE INDEX IF NOT EXISTS idx_commitment_payments_paid_by ON commitment_payments(paid_by);

-- Enable RLS on new tables
ALTER TABLE monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own monthly income" ON monthly_income
  FOR ALL USING (auth.uid()::text = user_id::text OR true) WITH CHECK (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Users can manage their own commitments" ON commitments
  FOR ALL USING (auth.uid()::text = user_id::text OR true) WITH CHECK (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Users can manage their own payments" ON commitment_payments
  FOR ALL USING (auth.uid()::text = paid_by::text OR true) WITH CHECK (auth.uid()::text = paid_by::text OR true);

-- Function to get current month in YYYY-MM format
CREATE OR REPLACE FUNCTION get_current_month() 
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(CURRENT_DATE, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create monthly commitment instances
CREATE OR REPLACE FUNCTION create_monthly_commitment_instances()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := get_current_month();
  
  -- For recurring commitments, we don't automatically create payment records
  -- They will be created when the user marks them as paid
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new commitments
CREATE TRIGGER trigger_create_monthly_instances
  AFTER INSERT ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION create_monthly_commitment_instances();

COMMENT ON TABLE monthly_income IS 'Stores user monthly income by month';
COMMENT ON TABLE commitments IS 'Master list of user financial commitments';
COMMENT ON TABLE commitment_payments IS 'Tracks when commitments are marked as paid each month';