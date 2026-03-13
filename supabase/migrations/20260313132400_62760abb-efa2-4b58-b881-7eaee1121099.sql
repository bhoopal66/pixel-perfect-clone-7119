
-- =============================================
-- PHASE 1A: EXTEND EXISTING TABLES
-- =============================================

-- Extend assessment_cases → case_master fields
ALTER TABLE public.assessment_cases
  ADD COLUMN IF NOT EXISTS trade_license_number text,
  ADD COLUMN IF NOT EXISTS trn text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS legal_form text,
  ADD COLUMN IF NOT EXISTS emirate text,
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS analysis_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lenders_run_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_matching_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS latest_report_version integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Extend assessment_documents → full document storage
ALTER TABLE public.assessment_documents
  ADD COLUMN IF NOT EXISTS original_file_name text,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS upload_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS checksum_hash text,
  ADD COLUMN IF NOT EXISTS duplicate_flag boolean NOT NULL DEFAULT false;

-- Extend assessment_bank_transactions
ALTER TABLE public.assessment_bank_transactions
  ADD COLUMN IF NOT EXISTS extraction_run_id uuid,
  ADD COLUMN IF NOT EXISTS account_number_masked text,
  ADD COLUMN IF NOT EXISTS source_page integer,
  ADD COLUMN IF NOT EXISTS raw_text_reference text;

-- Extend assessment_vat_returns
ALTER TABLE public.assessment_vat_returns
  ADD COLUMN IF NOT EXISTS extraction_run_id uuid,
  ADD COLUMN IF NOT EXISTS source_page integer;

-- Extend lender_execution_results
ALTER TABLE public.lender_execution_results
  ADD COLUMN IF NOT EXISTS summary_id uuid,
  ADD COLUMN IF NOT EXISTS pricing_band text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Extend lender_rule_result_details
ALTER TABLE public.lender_rule_result_details
  ADD COLUMN IF NOT EXISTS rule_name text,
  ADD COLUMN IF NOT EXISTS threshold_value_secondary text;

-- Extend lender_match_results
ALTER TABLE public.lender_match_results
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- =============================================
-- PHASE 1B: CREATE NEW TABLES
-- =============================================

-- extraction_runs
CREATE TABLE IF NOT EXISTS public.extraction_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.assessment_documents(id) ON DELETE SET NULL,
  extraction_type text NOT NULL DEFAULT 'bank_statement',
  extraction_status text NOT NULL DEFAULT 'pending',
  extracted_by_engine text,
  confidence_score numeric DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- combined_financial_summary (versioned)
CREATE TABLE IF NOT EXISTS public.combined_financial_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  summary_version integer NOT NULL DEFAULT 1,
  period_from date,
  period_to date,
  avg_monthly_bank_credit numeric DEFAULT 0,
  avg_monthly_debit numeric DEFAULT 0,
  avg_monthly_balance numeric DEFAULT 0,
  adjusted_monthly_turnover numeric DEFAULT 0,
  adjusted_annual_turnover numeric DEFAULT 0,
  vat_monthly_sales numeric DEFAULT 0,
  bank_vat_variance numeric DEFAULT 0,
  negative_balance_days integer DEFAULT 0,
  returned_cheque_count integer DEFAULT 0,
  cash_deposit_ratio numeric DEFAULT 0,
  internal_transfer_percentage numeric DEFAULT 0,
  one_off_credit_percentage numeric DEFAULT 0,
  business_vintage_months integer DEFAULT 0,
  top_5_customer_concentration numeric DEFAULT 0,
  receivable_days numeric DEFAULT 0,
  receivable_overdue_percent numeric DEFAULT 0,
  repeat_buyer_ratio numeric DEFAULT 0,
  inventory_value numeric DEFAULT 0,
  inventory_turn_days numeric DEFAULT 0,
  pos_monthly_settlement numeric DEFAULT 0,
  ecommerce_monthly_settlement numeric DEFAULT 0,
  gross_margin_percentage numeric DEFAULT 0,
  break_even_status boolean DEFAULT false,
  uae_client_percentage numeric DEFAULT 0,
  client_type text,
  average_client_credit_days numeric DEFAULT 0,
  existing_debt numeric DEFAULT 0,
  use_of_proceeds text,
  profitability_last_12_months numeric DEFAULT 0,
  shareholder_management_tenure_months integer DEFAULT 0,
  aecb_score numeric,
  risk_flags_json jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

-- ai_credit_decision_results
CREATE TABLE IF NOT EXISTS public.ai_credit_decision_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  summary_id uuid REFERENCES public.combined_financial_summary(id) ON DELETE SET NULL,
  taamul_credit_score numeric DEFAULT 0,
  credit_rating text,
  recommended_lender_id uuid REFERENCES public.onboarding_lenders(id) ON DELETE SET NULL,
  recommended_product_id uuid REFERENCES public.lender_products(id) ON DELETE SET NULL,
  recommended_limit numeric DEFAULT 0,
  approval_probability numeric DEFAULT 0,
  key_strengths_json jsonb DEFAULT '[]'::jsonb,
  risk_flags_json jsonb DEFAULT '[]'::jsonb,
  decision_notes text,
  model_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- case_reports
CREATE TABLE IF NOT EXISTS public.case_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  report_name text NOT NULL,
  report_version integer NOT NULL DEFAULT 1,
  file_name text NOT NULL,
  file_path text,
  file_url text,
  report_format text NOT NULL DEFAULT 'xlsx',
  based_on_summary_id uuid REFERENCES public.combined_financial_summary(id) ON DELETE SET NULL,
  based_on_execution_id uuid REFERENCES public.lender_execution_results(id) ON DELETE SET NULL,
  generated_by uuid,
  generated_at timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true,
  remarks text
);

-- case_activity_log
CREATE TABLE IF NOT EXISTS public.case_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_description text,
  reference_table text,
  reference_id uuid,
  done_by uuid,
  done_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK for extraction_run_id on transactions and vat
ALTER TABLE public.assessment_bank_transactions
  ADD CONSTRAINT fk_bank_txn_extraction_run
  FOREIGN KEY (extraction_run_id) REFERENCES public.extraction_runs(id) ON DELETE SET NULL;

ALTER TABLE public.assessment_vat_returns
  ADD CONSTRAINT fk_vat_extraction_run
  FOREIGN KEY (extraction_run_id) REFERENCES public.extraction_runs(id) ON DELETE SET NULL;

ALTER TABLE public.lender_execution_results
  ADD CONSTRAINT fk_execution_summary
  FOREIGN KEY (summary_id) REFERENCES public.combined_financial_summary(id) ON DELETE SET NULL;

-- =============================================
-- PHASE 1C: STORAGE BUCKET FOR REPORTS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-reports', 'case-reports', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PHASE 1D: RLS POLICIES
-- =============================================

-- extraction_runs
ALTER TABLE public.extraction_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access extraction runs via case" ON public.extraction_runs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = extraction_runs.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- combined_financial_summary
ALTER TABLE public.combined_financial_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access financial summary via case" ON public.combined_financial_summary
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = combined_financial_summary.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- ai_credit_decision_results
ALTER TABLE public.ai_credit_decision_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access AI results via case" ON public.ai_credit_decision_results
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = ai_credit_decision_results.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- case_reports
ALTER TABLE public.case_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access reports via case" ON public.case_reports
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = case_reports.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- case_activity_log
ALTER TABLE public.case_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access activity log via case" ON public.case_activity_log
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = case_activity_log.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- Storage RLS for case-reports bucket
CREATE POLICY "Authenticated users can upload reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'case-reports');

CREATE POLICY "Authenticated users can read reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'case-reports');

-- =============================================
-- PHASE 1E: INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_extraction_runs_case ON public.extraction_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_combined_summary_case ON public.combined_financial_summary(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_case ON public.ai_credit_decision_results(case_id);
CREATE INDEX IF NOT EXISTS idx_case_reports_case ON public.case_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_case_reports_type ON public.case_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_case ON public.case_activity_log(case_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.case_activity_log(activity_type);

-- Realtime for activity log
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_activity_log;
