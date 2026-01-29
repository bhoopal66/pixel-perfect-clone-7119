-- Add interest rate field to cases table for EMI calculations
ALTER TABLE public.cases 
ADD COLUMN interest_rate numeric DEFAULT 12 NOT NULL;

-- Add tenure field for loan term
ALTER TABLE public.cases 
ADD COLUMN tenure_months integer DEFAULT 12 NOT NULL;

-- Add computed EMI fields
ALTER TABLE public.cases 
ADD COLUMN monthly_emi numeric DEFAULT 0 NOT NULL;

ALTER TABLE public.cases 
ADD COLUMN total_interest numeric DEFAULT 0 NOT NULL;

ALTER TABLE public.cases 
ADD COLUMN total_payable numeric DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.cases.interest_rate IS 'Annual interest rate percentage for EMI calculation';
COMMENT ON COLUMN public.cases.tenure_months IS 'Loan tenure in months';
COMMENT ON COLUMN public.cases.monthly_emi IS 'Calculated monthly EMI amount';
COMMENT ON COLUMN public.cases.total_interest IS 'Total interest over loan tenure';
COMMENT ON COLUMN public.cases.total_payable IS 'Total amount payable (principal + interest)';