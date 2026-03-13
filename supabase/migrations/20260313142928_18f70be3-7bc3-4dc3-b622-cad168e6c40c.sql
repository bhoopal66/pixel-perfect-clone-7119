
-- Rename columns
ALTER TABLE public.related_party_flow_summary RENAME COLUMN total_related_inflows TO total_related_credit;
ALTER TABLE public.related_party_flow_summary RENAME COLUMN total_related_outflows TO total_related_debit;
ALTER TABLE public.related_party_flow_summary RENAME COLUMN overall_ratio TO related_party_ratio;
ALTER TABLE public.related_party_flow_summary RENAME COLUMN parties_detected TO number_of_related_entities;
ALTER TABLE public.related_party_flow_summary RENAME COLUMN risk_level TO risk_flag;

-- Add new columns
ALTER TABLE public.related_party_flow_summary ADD COLUMN IF NOT EXISTS largest_related_entity TEXT;
ALTER TABLE public.related_party_flow_summary ADD COLUMN IF NOT EXISTS largest_related_flow NUMERIC DEFAULT 0;

-- Drop unused columns
ALTER TABLE public.related_party_flow_summary DROP COLUMN IF EXISTS total_bank_credits;
ALTER TABLE public.related_party_flow_summary DROP COLUMN IF EXISTS total_bank_debits;
ALTER TABLE public.related_party_flow_summary DROP COLUMN IF EXISTS inflow_ratio;
ALTER TABLE public.related_party_flow_summary DROP COLUMN IF EXISTS outflow_ratio;
ALTER TABLE public.related_party_flow_summary DROP COLUMN IF EXISTS transactions_matched;
ALTER TABLE public.related_party_flow_summary DROP COLUMN IF EXISTS updated_at;
