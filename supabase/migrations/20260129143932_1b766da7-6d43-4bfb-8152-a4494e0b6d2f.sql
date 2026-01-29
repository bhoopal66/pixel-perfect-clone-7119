-- Add company_name, period_start, and period_end columns to loan_eligibility table
ALTER TABLE public.loan_eligibility
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS period_start DATE,
ADD COLUMN IF NOT EXISTS period_end DATE;