
-- Bank Analysis Results (per account)
CREATE TABLE public.bank_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  account_number text,
  bank_name text,
  period_from date,
  period_to date,
  months_covered integer DEFAULT 0,

  -- 1. Credit turnover
  avg_monthly_credit_12m numeric DEFAULT 0,
  avg_monthly_credit_24m numeric DEFAULT 0,
  total_credits numeric DEFAULT 0,

  -- 2. Debit turnover
  avg_monthly_debit_12m numeric DEFAULT 0,
  avg_monthly_debit_24m numeric DEFAULT 0,
  total_debits numeric DEFAULT 0,

  -- 3. EOD Balance
  average_eod_balance numeric DEFAULT 0,

  -- 4. Min/Max balance
  min_monthly_balance numeric DEFAULT 0,
  max_monthly_balance numeric DEFAULT 0,
  peak_month text,
  trough_month text,

  -- 5. Cheque returns
  returned_cheque_count integer DEFAULT 0,
  returned_cheque_value numeric DEFAULT 0,
  returned_cheque_ratio numeric DEFAULT 0,
  returned_cheque_flag boolean DEFAULT false,

  -- 6. EMI / Loan deductions
  emi_monthly_total numeric DEFAULT 0,
  emi_lender_list jsonb DEFAULT '[]'::jsonb,

  -- 7. WPS / Salary
  monthly_salary_outflow numeric DEFAULT 0,
  estimated_employee_count integer DEFAULT 0,
  salary_consistency_flag text DEFAULT 'consistent',

  -- 8. Cash deposit ratio
  cash_deposit_ratio numeric DEFAULT 0,
  cash_risk_flag boolean DEFAULT false,

  -- 9. Single party concentration
  largest_payer_name text,
  largest_payer_ratio numeric DEFAULT 0,
  payer_concentration_flag boolean DEFAULT false,

  -- 10. Month-end balance trend
  month_end_balance_trend text DEFAULT 'stable',

  -- 11. Circular / round-tripping
  circular_flow_ratio numeric DEFAULT 0,
  round_tripping_flag boolean DEFAULT false,

  -- 12. Related party
  related_party_flow_ratio numeric DEFAULT 0,
  related_party_flag boolean DEFAULT false,

  -- 13. OD/CC utilization
  od_utilization_ratio numeric DEFAULT 0,

  -- 14. FX transactions
  fx_transaction_ratio numeric DEFAULT 0,
  fx_exposure_flag boolean DEFAULT false,

  -- 15. Government receipts
  government_receipt_ratio numeric DEFAULT 0,
  government_receivable_flag boolean DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Consolidated analysis across all accounts
CREATE TABLE public.bank_analysis_consolidated (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  total_monthly_credit numeric DEFAULT 0,
  total_monthly_debit numeric DEFAULT 0,
  overall_eod_balance numeric DEFAULT 0,
  overall_cash_ratio numeric DEFAULT 0,
  overall_return_ratio numeric DEFAULT 0,
  largest_concentration_ratio numeric DEFAULT 0,
  balance_trend text DEFAULT 'stable',
  overall_emi_total numeric DEFAULT 0,
  overall_salary_outflow numeric DEFAULT 0,
  overall_round_tripping_flag boolean DEFAULT false,
  overall_related_party_flag boolean DEFAULT false,
  overall_od_utilization numeric DEFAULT 0,
  overall_fx_ratio numeric DEFAULT 0,
  overall_govt_ratio numeric DEFAULT 0,
  overall_risk_flags jsonb DEFAULT '[]'::jsonb,
  accounts_analyzed integer DEFAULT 0,
  total_months_covered integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add UNIQUE constraint on case_id for consolidated (one per case)
ALTER TABLE public.bank_analysis_consolidated ADD CONSTRAINT uq_bank_analysis_consolidated_case UNIQUE (case_id);

-- RLS
ALTER TABLE public.bank_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_analysis_consolidated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access bank analysis results via case" ON public.bank_analysis_results
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = bank_analysis_results.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

CREATE POLICY "Access bank analysis consolidated via case" ON public.bank_analysis_consolidated
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = bank_analysis_consolidated.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));
