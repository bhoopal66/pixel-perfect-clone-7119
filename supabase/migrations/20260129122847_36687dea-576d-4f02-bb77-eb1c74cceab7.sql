-- Add new columns for POS calculations
ALTER TABLE public.loan_eligibility 
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS pos_monthly_turnover NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pos_cap_rate NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pos_annual_turnover NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pos_cap_adjusted NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pos_cap_vat NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pos_eligible_turnover NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS turnover_basis NUMERIC NOT NULL DEFAULT 0;

-- Add constraint for product_type values
ALTER TABLE public.loan_eligibility 
DROP CONSTRAINT IF EXISTS loan_eligibility_product_type_check;

ALTER TABLE public.loan_eligibility 
ADD CONSTRAINT loan_eligibility_product_type_check 
CHECK (product_type IN ('standard', 'rak_pos', 'wio_pos'));

-- Update the calculate_loan_eligibility function with POS logic
CREATE OR REPLACE FUNCTION public.calculate_loan_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_adjusted_turnover NUMERIC;
  v_variance_percent NUMERIC;
  v_max_turnover NUMERIC;
  v_eligible_multiplier NUMERIC;
  v_eligibility_status TEXT;
  v_variance_bucket TEXT;
  v_eligible_loan_amount NUMERIC;
  v_pos_cap_rate NUMERIC;
  v_pos_annual_turnover NUMERIC;
  v_pos_cap_adjusted NUMERIC;
  v_pos_cap_vat NUMERIC;
  v_pos_eligible_turnover NUMERIC;
  v_turnover_basis NUMERIC;
BEGIN
  -- Treat nulls as 0
  NEW.vat_turnover := COALESCE(NEW.vat_turnover, 0);
  NEW.declared_turnover := COALESCE(NEW.declared_turnover, 0);
  NEW.cash_adjustment := COALESCE(NEW.cash_adjustment, 0);
  NEW.sister_concern_adjustment := COALESCE(NEW.sister_concern_adjustment, 0);
  NEW.product_type := COALESCE(NEW.product_type, 'standard');
  NEW.pos_monthly_turnover := COALESCE(NEW.pos_monthly_turnover, 0);

  -- Calculate Adjusted Turnover
  v_adjusted_turnover := NEW.declared_turnover - NEW.cash_adjustment - NEW.sister_concern_adjustment;
  
  -- If adjusted_turnover < 0, set to 0
  IF v_adjusted_turnover < 0 THEN
    v_adjusted_turnover := 0;
  END IF;
  
  NEW.adjusted_turnover := v_adjusted_turnover;

  -- Determine POS cap rate based on product type
  CASE NEW.product_type
    WHEN 'rak_pos' THEN v_pos_cap_rate := 0.40;
    WHEN 'wio_pos' THEN v_pos_cap_rate := 0.30;
    ELSE v_pos_cap_rate := 0;
  END CASE;
  NEW.pos_cap_rate := v_pos_cap_rate;

  -- Calculate POS fields
  v_pos_annual_turnover := NEW.pos_monthly_turnover * 12;
  v_pos_cap_adjusted := v_adjusted_turnover * v_pos_cap_rate;
  v_pos_cap_vat := NEW.vat_turnover * v_pos_cap_rate;
  
  NEW.pos_annual_turnover := v_pos_annual_turnover;
  NEW.pos_cap_adjusted := v_pos_cap_adjusted;
  NEW.pos_cap_vat := v_pos_cap_vat;

  -- Calculate POS eligible turnover (MIN of the three values)
  IF NEW.product_type IN ('rak_pos', 'wio_pos') THEN
    v_pos_eligible_turnover := LEAST(v_pos_annual_turnover, v_pos_cap_adjusted, v_pos_cap_vat);
  ELSE
    v_pos_eligible_turnover := 0;
  END IF;
  NEW.pos_eligible_turnover := v_pos_eligible_turnover;

  -- Determine turnover basis
  IF NEW.product_type IN ('rak_pos', 'wio_pos') THEN
    v_turnover_basis := v_pos_eligible_turnover;
  ELSE
    v_turnover_basis := v_adjusted_turnover;
  END IF;
  NEW.turnover_basis := v_turnover_basis;

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

  -- Calculate Eligible Loan Amount using turnover basis
  IF v_eligible_multiplier > 0 THEN
    v_eligible_loan_amount := v_turnover_basis * v_eligible_multiplier;
  ELSE
    v_eligible_loan_amount := 0;
  END IF;
  
  NEW.eligible_loan_amount := v_eligible_loan_amount;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS calculate_loan_eligibility_trigger ON public.loan_eligibility;
CREATE TRIGGER calculate_loan_eligibility_trigger
  BEFORE INSERT OR UPDATE ON public.loan_eligibility
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_loan_eligibility();