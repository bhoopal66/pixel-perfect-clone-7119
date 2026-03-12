
-- Assessment cases master table
CREATE TABLE public.assessment_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE,
  company_name text,
  user_id uuid,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  analyst_notes text,
  approved_by uuid,
  approved_at timestamptz,
  total_bank_credits numeric DEFAULT 0,
  total_bank_debits numeric DEFAULT 0,
  avg_monthly_credit numeric DEFAULT 0,
  avg_monthly_debit numeric DEFAULT 0,
  avg_monthly_balance numeric DEFAULT 0,
  estimated_annual_turnover numeric DEFAULT 0,
  declared_vat_turnover numeric DEFAULT 0,
  bank_vat_variance_percent numeric DEFAULT 0,
  normalized_turnover numeric DEFAULT 0,
  variance_tag text,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  statement_months_covered integer DEFAULT 0,
  vat_periods_covered integer DEFAULT 0
);

-- Uploaded documents tracking
CREATE TABLE public.assessment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.assessment_cases(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text,
  file_size integer,
  bank_name text,
  account_holder text,
  account_number text,
  period_from date,
  period_to date,
  is_duplicate boolean DEFAULT false,
  is_password_protected boolean DEFAULT false,
  validation_status text DEFAULT 'pending',
  validation_message text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bank transactions
CREATE TABLE public.assessment_bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.assessment_cases(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.assessment_documents(id) ON DELETE CASCADE,
  txn_date date,
  description text,
  cheque_no text,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  month integer,
  year integer,
  bank_name text,
  account_name text,
  category text,
  is_excluded boolean DEFAULT false,
  exclusion_reason text,
  is_recurring boolean DEFAULT false,
  is_related_party boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bank statement monthly summary
CREATE TABLE public.assessment_bank_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.assessment_cases(id) ON DELETE CASCADE NOT NULL,
  bank_name text,
  account_number text,
  month integer NOT NULL,
  year integer NOT NULL,
  total_credits numeric DEFAULT 0,
  total_debits numeric DEFAULT 0,
  credit_count integer DEFAULT 0,
  debit_count integer DEFAULT 0,
  highest_credit numeric DEFAULT 0,
  lowest_balance numeric DEFAULT 0,
  avg_daily_balance numeric DEFAULT 0,
  closing_balance numeric DEFAULT 0,
  cash_deposit_total numeric DEFAULT 0,
  negative_balance_days integer DEFAULT 0,
  bounce_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- VAT return data
CREATE TABLE public.assessment_vat_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.assessment_cases(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.assessment_documents(id) ON DELETE CASCADE,
  tax_period_from date,
  tax_period_to date,
  vat_sales numeric DEFAULT 0,
  taxable_supplies numeric DEFAULT 0,
  zero_rated_supplies numeric DEFAULT 0,
  exempt_supplies numeric DEFAULT 0,
  output_vat numeric DEFAULT 0,
  input_vat numeric DEFAULT 0,
  net_vat_payable numeric DEFAULT 0,
  filing_date date,
  trn text,
  source_file text,
  is_edited boolean DEFAULT false,
  original_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lender rule results
CREATE TABLE public.assessment_lender_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.assessment_cases(id) ON DELETE CASCADE NOT NULL,
  lender_id uuid REFERENCES public.onboarding_lenders(id) ON DELETE CASCADE NOT NULL,
  lender_name text NOT NULL,
  product_name text,
  eligibility_status text NOT NULL DEFAULT 'pending',
  recommended_limit numeric DEFAULT 0,
  limit_basis text,
  tenure_months integer,
  pricing_band text,
  key_reasons jsonb DEFAULT '[]'::jsonb,
  failed_rules jsonb DEFAULT '[]'::jsonb,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  passed_rules jsonb DEFAULT '[]'::jsonb,
  required_deviations jsonb DEFAULT '[]'::jsonb,
  rule_details jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Analyst adjustments
CREATE TABLE public.assessment_analyst_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.assessment_cases(id) ON DELETE CASCADE NOT NULL,
  adjustment_type text NOT NULL,
  target_entity text,
  target_id uuid,
  field_name text,
  original_value text,
  adjusted_value text,
  reason text NOT NULL,
  adjusted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.assessment_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_bank_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_vat_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_lender_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_analyst_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage assessment cases" ON public.assessment_cases
  FOR ALL TO authenticated
  USING (has_admin_privileges() OR is_supervisor() OR is_coordinator() OR user_id = auth.uid())
  WITH CHECK (has_admin_privileges() OR is_supervisor() OR is_coordinator() OR user_id = auth.uid());

CREATE POLICY "Access assessment documents via case" ON public.assessment_documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessment_cases c WHERE c.id = assessment_documents.case_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));

CREATE POLICY "Access bank transactions via case" ON public.assessment_bank_transactions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessment_cases c WHERE c.id = assessment_bank_transactions.case_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));

CREATE POLICY "Access bank summaries via case" ON public.assessment_bank_summaries
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessment_cases c WHERE c.id = assessment_bank_summaries.case_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));

CREATE POLICY "Access VAT returns via case" ON public.assessment_vat_returns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessment_cases c WHERE c.id = assessment_vat_returns.case_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));

CREATE POLICY "Access lender results via case" ON public.assessment_lender_results
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessment_cases c WHERE c.id = assessment_lender_results.case_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));

CREATE POLICY "Access adjustments via case" ON public.assessment_analyst_adjustments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessment_cases c WHERE c.id = assessment_analyst_adjustments.case_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));

-- Auto-generate case number
CREATE OR REPLACE FUNCTION public.generate_assessment_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_year TEXT;
  v_seq_num INTEGER;
  v_case_number TEXT;
BEGIN
  IF NEW.case_number IS NULL THEN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COUNT(*) + 1 INTO v_seq_num
    FROM public.assessment_cases
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND case_number IS NOT NULL;
    v_case_number := 'EA-' || v_year || '-' || LPAD(v_seq_num::TEXT, 4, '0');
    WHILE EXISTS (SELECT 1 FROM public.assessment_cases WHERE case_number = v_case_number) LOOP
      v_seq_num := v_seq_num + 1;
      v_case_number := 'EA-' || v_year || '-' || LPAD(v_seq_num::TEXT, 4, '0');
    END LOOP;
    NEW.case_number := v_case_number;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_assessment_case_number_trigger
  BEFORE INSERT ON public.assessment_cases
  FOR EACH ROW EXECUTE FUNCTION public.generate_assessment_case_number();
