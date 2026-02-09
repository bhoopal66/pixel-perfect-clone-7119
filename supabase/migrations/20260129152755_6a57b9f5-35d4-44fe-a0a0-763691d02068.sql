-- Create unified cases table with all fields
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- A) Case Core
  client_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'Draft',
  
  -- B) Bank Statement Analysis
  statement_pdf_url TEXT,
  statement_period_from DATE,
  statement_period_to DATE,
  vat_turnover NUMERIC NOT NULL DEFAULT 0,
  declared_turnover NUMERIC NOT NULL DEFAULT 0,
  cash_adjustment NUMERIC NOT NULL DEFAULT 0,
  sister_concern_adjustment NUMERIC NOT NULL DEFAULT 0,
  
  -- C) Eligibility Inputs
  pos_monthly_turnover NUMERIC NOT NULL DEFAULT 0,
  
  -- D) Eligibility Computed Outputs
  adjusted_turnover NUMERIC NOT NULL DEFAULT 0,
  variance_percent NUMERIC NOT NULL DEFAULT 0,
  variance_bucket TEXT NOT NULL DEFAULT 'N/A',
  eligible_multiplier NUMERIC NOT NULL DEFAULT 0,
  pos_cap_rate NUMERIC NOT NULL DEFAULT 0,
  pos_annual_turnover NUMERIC NOT NULL DEFAULT 0,
  pos_eligible_turnover NUMERIC NOT NULL DEFAULT 0,
  turnover_basis NUMERIC NOT NULL DEFAULT 0,
  eligibility_method TEXT NOT NULL DEFAULT 'Normal',
  eligible_loan_amount NUMERIC NOT NULL DEFAULT 0,
  abcd_fee_amount NUMERIC NOT NULL DEFAULT 0,
  eligibility_status TEXT NOT NULL DEFAULT 'Pending',
  
  -- Metadata
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all cases"
  ON public.cases FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cases"
  ON public.cases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cases"
  ON public.cases FOR UPDATE
  USING (true);

CREATE POLICY "Only admins can delete cases"
  ON public.cases FOR DELETE
  USING (public.is_admin());

-- Create trigger function for computing eligibility
CREATE OR REPLACE FUNCTION public.calculate_case_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_adjusted_turnover NUMERIC;
  v_variance_percent NUMERIC;
  v_max_turnover NUMERIC;
  v_eligible_multiplier NUMERIC;
  v_variance_bucket TEXT;
  v_pos_cap_rate NUMERIC;
  v_pos_annual_turnover NUMERIC;
  v_pos_eligible_turnover NUMERIC;
  v_turnover_basis NUMERIC;
  v_eligibility_method TEXT;
  v_eligible_loan_amount NUMERIC;
  v_abcd_fee_amount NUMERIC;
  v_eligibility_status TEXT;
BEGIN
  -- Treat nulls as 0
  NEW.vat_turnover := COALESCE(NEW.vat_turnover, 0);
  NEW.declared_turnover := COALESCE(NEW.declared_turnover, 0);
  NEW.cash_adjustment := COALESCE(NEW.cash_adjustment, 0);
  NEW.sister_concern_adjustment := COALESCE(NEW.sister_concern_adjustment, 0);
  NEW.pos_monthly_turnover := COALESCE(NEW.pos_monthly_turnover, 0);

  -- 2.1 Calculate Adjusted Turnover (floor at 0)
  v_adjusted_turnover := GREATEST(0, NEW.declared_turnover - NEW.cash_adjustment - NEW.sister_concern_adjustment);
  NEW.adjusted_turnover := v_adjusted_turnover;

  -- If no declared turnover, mark as pending
  IF NEW.declared_turnover = 0 THEN
    NEW.variance_percent := 0;
    NEW.variance_bucket := 'N/A';
    NEW.eligible_multiplier := 0;
    NEW.eligible_loan_amount := 0;
    NEW.abcd_fee_amount := 0;
    NEW.eligibility_method := 'Normal';
    NEW.eligibility_status := 'Pending';
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- 2.2 Calculate Variance %
  v_max_turnover := GREATEST(NEW.vat_turnover, v_adjusted_turnover);
  IF v_max_turnover = 0 THEN
    v_variance_percent := 0;
  ELSE
    v_variance_percent := ROUND(ABS(NEW.vat_turnover - v_adjusted_turnover) / v_max_turnover * 100, 2);
  END IF;
  NEW.variance_percent := v_variance_percent;

  -- 2.3 Determine Multiplier and Bucket
  IF v_variance_percent <= 10 THEN
    v_eligible_multiplier := 8;
    v_variance_bucket := '<=10%';
  ELSIF v_variance_percent <= 25 THEN
    v_eligible_multiplier := ROUND((8.0 / 6.0)::NUMERIC, 4);
    v_variance_bucket := '11%-25%';
  ELSE
    v_eligible_multiplier := 0;
    v_variance_bucket := '>25%';
  END IF;
  NEW.eligible_multiplier := v_eligible_multiplier;
  NEW.variance_bucket := v_variance_bucket;

  -- 2.4 POS Logic (determine cap rate and turnover basis)
  CASE NEW.product_type
    WHEN 'rak_pos' THEN v_pos_cap_rate := 0.40;
    WHEN 'wio_pos' THEN v_pos_cap_rate := 0.30;
    ELSE v_pos_cap_rate := 0;
  END CASE;
  NEW.pos_cap_rate := v_pos_cap_rate;

  IF NEW.product_type IN ('rak_pos', 'wio_pos') THEN
    v_pos_annual_turnover := NEW.pos_monthly_turnover * 12;
    v_pos_eligible_turnover := LEAST(
      v_pos_annual_turnover,
      v_pos_cap_rate * v_adjusted_turnover,
      v_pos_cap_rate * NEW.vat_turnover
    );
    v_turnover_basis := v_pos_eligible_turnover;
  ELSE
    v_pos_annual_turnover := 0;
    v_pos_eligible_turnover := 0;
    v_turnover_basis := v_adjusted_turnover;
  END IF;
  NEW.pos_annual_turnover := v_pos_annual_turnover;
  NEW.pos_eligible_turnover := v_pos_eligible_turnover;
  NEW.turnover_basis := v_turnover_basis;

  -- 2.5 Compute Eligible Loan Amount (Normal vs Reverse ABCD)
  IF v_eligible_multiplier > 0 THEN
    v_eligible_loan_amount := v_turnover_basis * v_eligible_multiplier;
    v_eligibility_method := 'Normal';
  ELSE
    -- Reverse ABCD: Loan = Adjusted Turnover
    v_eligible_loan_amount := v_adjusted_turnover;
    v_eligibility_method := 'Reverse (ABCD 1%)';
  END IF;
  NEW.eligible_loan_amount := ROUND(v_eligible_loan_amount, 2);
  NEW.eligibility_method := v_eligibility_method;

  -- 2.6 ABCD Fee (always 1%)
  v_abcd_fee_amount := ROUND(v_eligible_loan_amount * 0.01, 2);
  NEW.abcd_fee_amount := v_abcd_fee_amount;

  -- 2.7 Eligibility Status (RAG)
  IF v_eligibility_method = 'Normal' THEN
    IF v_variance_percent <= 10 THEN
      v_eligibility_status := 'Eligible';
    ELSE
      v_eligibility_status := 'Eligible (Reduced)';
    END IF;
  ELSE
    v_eligibility_status := 'Eligible (Reverse)';
  END IF;
  NEW.eligibility_status := v_eligibility_status;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER calculate_case_eligibility_trigger
  BEFORE INSERT OR UPDATE OF 
    product_type, vat_turnover, declared_turnover, 
    cash_adjustment, sister_concern_adjustment, pos_monthly_turnover
  ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_case_eligibility();

-- Create indexes
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_bank_name ON public.cases(bank_name);
CREATE INDEX idx_cases_product_type ON public.cases(product_type);
CREATE INDEX idx_cases_created_at ON public.cases(created_at DESC);