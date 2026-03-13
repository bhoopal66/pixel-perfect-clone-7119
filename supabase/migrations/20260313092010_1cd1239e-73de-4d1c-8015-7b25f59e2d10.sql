
-- Add manual-input fields to assessment_cases for HFS-style criteria
ALTER TABLE public.assessment_cases
  ADD COLUMN IF NOT EXISTS receivable_days numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_margin_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS existing_debt_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uae_revenue_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS b2b_revenue_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_collection_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proceeds_for_cogs boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS past_breakeven boolean DEFAULT false;
