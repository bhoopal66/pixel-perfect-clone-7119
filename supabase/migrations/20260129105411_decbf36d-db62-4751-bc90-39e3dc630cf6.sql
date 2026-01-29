-- Create loan_eligibility table
CREATE TABLE public.loan_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Input fields
  vat_turnover NUMERIC DEFAULT 0 NOT NULL,
  declared_turnover NUMERIC DEFAULT 0 NOT NULL,
  cash_adjustment NUMERIC DEFAULT 0 NOT NULL,
  sister_concern_adjustment NUMERIC DEFAULT 0 NOT NULL,
  
  -- Computed fields (persisted)
  adjusted_turnover NUMERIC DEFAULT 0 NOT NULL,
  variance_percent NUMERIC(10,2) DEFAULT 0 NOT NULL,
  variance_bucket TEXT DEFAULT '<=10%' NOT NULL,
  eligible_multiplier NUMERIC(10,4) DEFAULT 0 NOT NULL,
  eligibility_status TEXT DEFAULT 'Insufficient Data' NOT NULL,
  eligible_loan_amount NUMERIC DEFAULT 0 NOT NULL,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.loan_eligibility ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (adjust as needed for auth)
CREATE POLICY "Allow public read" ON public.loan_eligibility FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.loan_eligibility FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.loan_eligibility FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.loan_eligibility FOR DELETE USING (true);

-- Create the calculation function
CREATE OR REPLACE FUNCTION public.calculate_loan_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adjusted_turnover NUMERIC;
  v_variance_percent NUMERIC;
  v_max_turnover NUMERIC;
  v_eligible_multiplier NUMERIC;
  v_eligibility_status TEXT;
  v_variance_bucket TEXT;
  v_eligible_loan_amount NUMERIC;
BEGIN
  -- Treat nulls as 0
  NEW.vat_turnover := COALESCE(NEW.vat_turnover, 0);
  NEW.declared_turnover := COALESCE(NEW.declared_turnover, 0);
  NEW.cash_adjustment := COALESCE(NEW.cash_adjustment, 0);
  NEW.sister_concern_adjustment := COALESCE(NEW.sister_concern_adjustment, 0);

  -- Calculate Adjusted Turnover
  v_adjusted_turnover := NEW.declared_turnover - NEW.cash_adjustment - NEW.sister_concern_adjustment;
  
  -- If adjusted_turnover < 0, set to 0
  IF v_adjusted_turnover < 0 THEN
    v_adjusted_turnover := 0;
  END IF;
  
  NEW.adjusted_turnover := v_adjusted_turnover;

  -- Check for Insufficient Data
  IF NEW.declared_turnover = 0 OR NEW.declared_turnover IS NULL THEN
    NEW.eligibility_status := 'Insufficient Data';
    NEW.eligible_loan_amount := 0;
    NEW.variance_percent := 0;
    NEW.variance_bucket := 'N/A';
    NEW.eligible_multiplier := 0;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- Calculate Variance %
  v_max_turnover := GREATEST(NEW.vat_turnover, v_adjusted_turnover);
  
  IF v_max_turnover = 0 THEN
    v_variance_percent := 0;
  ELSE
    v_variance_percent := ROUND(ABS(NEW.vat_turnover - v_adjusted_turnover) / v_max_turnover * 100, 2);
  END IF;
  
  NEW.variance_percent := v_variance_percent;

  -- Determine Bucket and Eligibility
  IF v_variance_percent <= 10 THEN
    v_eligible_multiplier := 8;
    v_eligibility_status := 'Eligible';
    v_variance_bucket := '<=10%';
  ELSIF v_variance_percent <= 25 THEN
    v_eligible_multiplier := 8.0 / 6.0;
    v_eligibility_status := 'Eligible (Reduced)';
    v_variance_bucket := '11%-25%';
  ELSE
    v_eligible_multiplier := 0;
    v_eligibility_status := 'Not Eligible';
    v_variance_bucket := '>25%';
  END IF;
  
  NEW.eligible_multiplier := v_eligible_multiplier;
  NEW.eligibility_status := v_eligibility_status;
  NEW.variance_bucket := v_variance_bucket;

  -- Calculate Eligible Loan Amount
  IF v_eligible_multiplier > 0 THEN
    v_eligible_loan_amount := v_adjusted_turnover * v_eligible_multiplier;
  ELSE
    v_eligible_loan_amount := 0;
  END IF;
  
  NEW.eligible_loan_amount := v_eligible_loan_amount;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_calculate_loan_eligibility
  BEFORE INSERT OR UPDATE OF vat_turnover, declared_turnover, cash_adjustment, sister_concern_adjustment
  ON public.loan_eligibility
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_loan_eligibility();

-- Create indexes for filtering
CREATE INDEX idx_loan_eligibility_status ON public.loan_eligibility(eligibility_status);
CREATE INDEX idx_loan_eligibility_bucket ON public.loan_eligibility(variance_bucket);
CREATE INDEX idx_loan_eligibility_created ON public.loan_eligibility(created_at);