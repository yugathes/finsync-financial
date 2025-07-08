-- Create monthly_income table for tracking income per month per user
CREATE TABLE IF NOT EXISTS public.monthly_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2025-07')
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Create commitment_payments table for tracking payment status
CREATE TABLE IF NOT EXISTS public.commitment_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commitment_id INTEGER NOT NULL,
  month TEXT NOT NULL, -- Format: 'YYYY-MM'
  paid_by INTEGER NOT NULL,
  amount_paid NUMERIC NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(commitment_id, month)
);

-- Update commitments table to match new schema requirements
ALTER TABLE public.commitments 
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_id UUID,
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

-- Remove old columns that don't match new schema
ALTER TABLE public.commitments 
DROP COLUMN IF EXISTS is_paid,
DROP COLUMN IF EXISTS is_shared,
DROP COLUMN IF EXISTS shared_with,
DROP COLUMN IF EXISTS due_date;

-- Change id column to UUID to match new schema
-- First create new table with correct schema
CREATE TABLE IF NOT EXISTS public.commitments_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'static' | 'dynamic'
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  recurring BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  group_id UUID,
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Copy existing data to new table
INSERT INTO public.commitments_new (user_id, type, title, category, amount, recurring, shared, start_date, created_at, updated_at)
SELECT user_id, type, title, category, amount, false, false, CURRENT_DATE, created_at, updated_at
FROM public.commitments;

-- Drop old table and rename new one
DROP TABLE IF EXISTS public.commitments;
ALTER TABLE public.commitments_new RENAME TO commitments;

-- Enable RLS on new tables
ALTER TABLE public.monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly_income
CREATE POLICY "Users can view their own monthly income" 
ON public.monthly_income 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own monthly income" 
ON public.monthly_income 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own monthly income" 
ON public.monthly_income 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own monthly income" 
ON public.monthly_income 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create RLS policies for commitment_payments
CREATE POLICY "Users can view their own commitment payments" 
ON public.commitment_payments 
FOR SELECT 
USING (auth.uid()::text = paid_by::text);

CREATE POLICY "Users can create their own commitment payments" 
ON public.commitment_payments 
FOR INSERT 
WITH CHECK (auth.uid()::text = paid_by::text);

CREATE POLICY "Users can update their own commitment payments" 
ON public.commitment_payments 
FOR UPDATE 
USING (auth.uid()::text = paid_by::text);

CREATE POLICY "Users can delete their own commitment payments" 
ON public.commitment_payments 
FOR DELETE 
USING (auth.uid()::text = paid_by::text);

-- Update commitments RLS policies to work with new schema
DROP POLICY IF EXISTS "Enable all access for commitments" ON public.commitments;

CREATE POLICY "Users can view their own commitments" 
ON public.commitments 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own commitments" 
ON public.commitments 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own commitments" 
ON public.commitments 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own commitments" 
ON public.commitments 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_monthly_income_updated_at
  BEFORE UPDATE ON public.monthly_income
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints for data integrity
ALTER TABLE public.commitment_payments
ADD CONSTRAINT fk_commitment_payments_commitment_id 
FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE CASCADE;

ALTER TABLE public.commitment_payments
ADD CONSTRAINT fk_commitment_payments_paid_by 
FOREIGN KEY (paid_by) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.commitments
ADD CONSTRAINT fk_commitments_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.monthly_income
ADD CONSTRAINT fk_monthly_income_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;